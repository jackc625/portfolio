---
phase: 21-experience-content-pipeline-collection
verified: 2026-07-09T09:06:30Z
status: passed
human_verified: 2026-07-09T12:39:09Z
score: 15/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open src/content/experience/holloway.mdx after sync and read the body top to bottom."
    expected: "The body reads as the intended deep-dive: opens with the 'Contract engagement' blockquote lede, then Overview -> Highlights (numbered sections) -> Themes at a glance, with no truncation, mangled formatting, or content that doesn't belong."
    why_human: "This is an authorial-judgment / content-quality check (A2 in 21-VALIDATION.md), not a code-behavior check. Automated checks (body-grep for 'Contract engagement', fence-count assertions, astro check) prove the fence extracted and the lede landed, but only a human can confirm the fenced prose is the intended, well-formed deep-dive content. Carried forward verbatim from 21-03's <human-check> block per the end-of-phase deferral pattern."
---

# Phase 21: Experience Content Pipeline & Collection Verification Report

**Phase Goal:** A typed, Zod-validated `experience` content collection exists, fed from `Experience/*.md` through a sync pipeline mirroring `scripts/sync-projects.mjs`, carrying the fields and ordering contract the Experience surface will render.
**Verified:** 2026-07-09T09:06:30Z
**Status:** passed (human check cleared via 21-UAT.md on 2026-07-09)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sync script mirrors `sync-projects.mjs` (fenced-block extraction, byte-for-byte frontmatter preservation, LF normalization, path-traversal guard, diff-then-write idempotency, `--check` drift mode) | VERIFIED | `scripts/sync-experience.mjs` reviewed line-by-line; exports `normalize`, `readSourceField`, `sliceFrontmatter`, `extractFence`; internal `syncOne`/`main`; CLI guard `if (process.argv[1] === fileURLToPath(import.meta.url))` present |
| 2 | `node scripts/sync-experience.mjs --check` exits 0 on clean tree, exits 1 on drift (SC1) | VERIFIED | Manually ran `pnpm sync:experience:check` -> exit 0, "unchanged" for both entries. `tests/scripts/sync-experience-check.test.ts` has both cases (exit 0 clean, `status===1` on mutated source), ran green |
| 3 | A second write-mode sync run over an unchanged entry does NOT rewrite the file (contents + mtimeMs unchanged) (SC1, review finding #1) | VERIFIED | `tests/scripts/sync-experience-idempotency.test.ts` asserts `secondContents === firstContents` AND `secondStat.mtimeMs === firstStat.mtimeMs`; ran green |
| 4 | A `source:` path escaping the project root exits 2 (path-traversal guard, review finding #2) | VERIFIED | `scripts/sync-experience.mjs:127-134` guard logic present; test asserts both the `escapes project root` message AND captured `err.status === 2`; ran green |
| 5 | `experience` collection registered, typed Zod schema (role, company, location, dates, techStack, summary, highlights, engagementType, hasCaseStudy, source) alongside `projects` (SC2) | VERIFIED | `src/content.config.ts:25-44`; `export const collections = { projects, experience }` — additive, `projects` block untouched |
| 6 | `astro check` validates frontmatter at build time, 0 errors (SC2) | VERIFIED | Ran `pnpm exec astro check` -> "Result (121 files): 0 errors, 0 warnings, 1 hint" (hint is pre-existing, unrelated `chat.ts` unused param) |
| 7 | Schema handles the two real optionality edges: Holloway's omitted `endDate`, Balfour's empty `techStack: []`, `highlights.max(5)` with no hard minimum | VERIFIED | `src/content.config.ts:32,34,36`: `endDate: z.coerce.date().optional()`, `techStack: z.array(z.string())` (no `.min`), `highlights: z.array(z.string()).max(5)` (no min); both real entries validate (astro check green) |
| 8 | `sortExperienceEntries()` reusable helper implements reverse-chronological ordering, importable independent of `astro:content`, unit-tested (SC3 / EXP-06) | VERIFIED | `src/lib/experience.ts` — pure generic `<T extends { data: { startDate: Date } }>`, returns new sorted array, non-mutating; `tests/scripts/sync-experience.test.ts` unit-tests it directly (Holloway 2026 sorts before Balfour 2023, and non-mutation), ran green |
| 9 | Both Holloway and Balfour entries exist, MDX bodies synced byte-for-byte from fenced `Experience/*.md` sources, sync idempotent | VERIFIED | `src/content/experience/{holloway,balfour-beatty}.mdx` exist with full frontmatter; fenced sources `Experience/{HOLLOWAY_EXPERIENCE,BALFOUR_BEATTY}.md` exist with matching fence-delimited bodies; `pnpm sync:experience:check` -> exit 0, "unchanged" |
| 10 | `pnpm build` succeeds with the new collection wired in (SC4) | VERIFIED | Ran `pnpm build` -> exit 0, full static + prerender + server build completed, "Complete!" |
| 11 | No new runtime dependencies added (SC4) | VERIFIED | `package.json`: 11 runtime dependencies / 12 devDependencies (matches plan's asserted counts) |
| 12 | `sync:experience` / `sync:experience:check` npm scripts exist and invoke the new script | VERIFIED | `package.json` scripts: `"sync:experience": "node scripts/sync-experience.mjs"`, `"sync:experience:check": "node scripts/sync-experience.mjs --check"` |
| 13 | `pnpm test` (not only CI) independently asserts each experience `source:` path resolves to an existing file (review finding #5) | VERIFIED | `tests/content/source-files-exist.test.ts` has a second describe block for `src/content/experience`, reusing the shared `SOURCE_RE`; ran green, both source files resolve |
| 14 | CI runs `pnpm sync:experience:check` as an independent step on PRs touching `Experience/**`, `src/content/experience/**`, or `scripts/sync-experience.mjs` (D-11) | VERIFIED | `.github/workflows/sync-check.yml` — three path globs added, "Verify Experience/ <-> MDX sync is clean" step present, placed after projects step, independent (not merged) |
| 15 | `docs/CONTENT-SCHEMA.md` documents the experience pipeline (fields, fence contract, author workflow, failure modes) and its authority preamble names `scripts/sync-experience.mjs` (review finding #4) | VERIFIED | Preamble at line 3-5 names all three code authorities; §5-§8 document frontmatter fields, fence contract (D-07 relaxed checks noted), author workflow, failure-mode matrix |
| 16 | Synced `holloway.mdx` body reads as the intended Overview -> Highlights -> Themes deep-dive (A2 authoring judgment) | ? UNCERTAIN (human_needed) | Automated proxy passes (body opens with "Contract engagement" lede, fence extracted correctly), but content-quality judgment requires a human read — see Human Verification below |

**Score:** 15/16 truths verified (1 routed to human verification; 0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/sync-experience.mjs` | Fenced-block sync mirroring sync-projects.mjs | VERIFIED | Exists, exports match, path-traversal guard present, wired via npm scripts |
| `src/lib/experience.ts` | `sortExperienceEntries` reverse-chron helper | VERIFIED | Exists, pure/generic, non-mutating, unit-tested |
| `src/content.config.ts` | `experience` collection + extended `collections` export | VERIFIED | Present, additive, schema matches D-01 spec exactly |
| `src/content/experience/holloway.mdx` | Full deep-dive entry, `endDate` omitted, `hasCaseStudy: true` | VERIFIED | Present, validates, body synced |
| `src/content/experience/balfour-beatty.mdx` | Lightweight entry, `techStack: []`, `hasCaseStudy: false` | VERIFIED | Present, validates, body synced |
| `Experience/HOLLOWAY_EXPERIENCE.md` | Fence markers added around existing body | VERIFIED | Exactly one start/end marker, lede inside fence |
| `Experience/BALFOUR_BEATTY.md` | New fenced source | VERIFIED | Exists, one start/end marker, first-person body |
| `tests/scripts/sync-experience.test.ts` | Unit + path-traversal + ordering tests | VERIFIED | 9 describe blocks, all pass |
| `tests/scripts/sync-experience-check.test.ts` | `--check` drift tests | VERIFIED | 2 tests (exit 0 / exit 1), pass |
| `tests/scripts/sync-experience-idempotency.test.ts` | Write-mode idempotency test | VERIFIED | 1 test, passes |
| `tests/content/source-files-exist.test.ts` | Experience source-existence describe block | VERIFIED | Added, reuses shared `SOURCE_RE`, passes |
| `.github/workflows/sync-check.yml` | Experience paths + verify step | VERIFIED | Present, independent step |
| `docs/CONTENT-SCHEMA.md` | Experience pipeline docs + preamble update | VERIFIED | Present, §5-§8 added, preamble updated |
| `package.json` | `sync:experience`/`sync:experience:check` scripts | VERIFIED | Present, no new deps (11/12) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/sync-experience.mjs` | `src/content/experience/*.mdx` | `MDX_GLOB = "src/content/experience/*.mdx"` | WIRED | Confirmed in script source |
| `scripts/sync-experience.mjs` | `Experience/*.md` | `source:` frontmatter field resolved + read | WIRED | `syncOne()` reads `sourcePath` from frontmatter, resolves against `PROJECT_ROOT`, reads fenced content |
| `src/content.config.ts` | `src/lib/experience.ts` | Phase-22 consumption contract: `sortExperienceEntries(await getCollection("experience"))` | WIRED (contract-level) | `startDate: z.coerce.date()` field shape matches the generic constraint `{ data: { startDate: Date } }` required by `sortExperienceEntries` |
| `.github/workflows/sync-check.yml` | `scripts/sync-experience.mjs` | `pnpm sync:experience:check` CI step | WIRED | Step present, script exists and is invoked via the exact npm script |
| `docs/CONTENT-SCHEMA.md` preamble | `scripts/sync-experience.mjs` | Named as a code authority | WIRED | Text confirmed at line 3-5 |

### Data-Flow Trace (Level 4)

Not applicable this phase — Phase 21 is data-layer only (per phase scope). No route or component renders the `experience` collection yet; that is explicitly Phase 22's scope. The collection's only "consumer" at this point is the build-time Zod validation gate (`astro check`) and the unit-tested `sortExperienceEntries` helper, both of which were verified directly above.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Sync idempotency (real repo state) | `pnpm sync:experience:check` | exit 0, "balfour-beatty.mdx: unchanged", "holloway.mdx: unchanged" | PASS |
| Full test suite | `pnpm test` | 608 passed, 2 skipped (matches expected) | PASS |
| Astro type/schema check | `pnpm exec astro check` | 0 errors, 0 warnings, 1 pre-existing unrelated hint | PASS |
| Production build | `pnpm build` | exit 0, static + server build completed | PASS |
| New experience-specific test files in isolation | `pnpm exec vitest run tests/scripts/sync-experience*.test.ts tests/content/source-files-exist.test.ts` | 4 files, 22 tests, all passed | PASS |
| Dependency count (SC4) | `node -e` inspecting `package.json` | 11 runtime / 12 dev | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXP-01 | 21-01, 21-02, 21-03, 21-04 | `experience` content collection with Zod-validated schema sourced from `Experience/*.md` via a sync pipeline mirroring `sync-projects.mjs` | SATISFIED | Full pipeline exists, tested, wired into CI, documented; `REQUIREMENTS.md` marks `[x]` and traceability table lists "Phase 21 / Complete" |
| EXP-06 | 21-01, 21-02, 21-03 | Experience entries render in reverse-chronological order with role, company, dates, tech/skills visible at a glance | SATISFIED (data-layer contract) | `sortExperienceEntries` helper + typed fields (`startDate`, `dateRange`, `techStack`, `role`, `company`) exist and are unit-tested; actual on-page rendering is explicitly Phase 22's scope per phase grounding notes — this phase delivers the ordering + field CONTRACT, which is what EXP-06 requires at this stage per the roadmap phase split |

No orphaned requirements found — `REQUIREMENTS.md`'s traceability table maps only EXP-01 and EXP-06 to Phase 21; both are accounted for across the four plans' `requirements:` frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/content/experience/holloway.mdx` | 68 | Matched `XXX` substring | Info (false positive) | The match is part of the string `C-XXXX-YYYY` (a job-number format placeholder in prose), not a debt marker. No action needed. |

No TBD/FIXME/HACK/PLACEHOLDER debt markers found in any file modified by this phase. No stub patterns (empty returns, static empty arrays feeding render, console.log-only handlers) found — this phase has no render surface yet, and the sync script's core logic is fully implemented per the analog mirror.

### Human Verification Required

### 1. Holloway deep-dive body content quality (carried from 21-03 human-check)

**Test:** Open `src/content/experience/holloway.mdx` after sync and read the body top to bottom.
**Expected:** Opens with the "Contract engagement" blockquote lede, then Overview -> Highlights (9 numbered sections) -> Themes at a glance, reading coherently as the intended deep-dive with no garbled formatting or missing content.
**Why human:** Automated checks (fence extraction, lede-string grep, schema validation) prove the mechanism worked, but only a human can judge whether the fenced prose is well-formed, complete, and reads as intended. This is the single Manual-Only check documented in 21-VALIDATION.md (A2) and was explicitly deferred to end-of-phase per the `<human-check>` block in 21-03-PLAN.md rather than requiring a mid-execution checkpoint.

**Resolution (2026-07-09):** PASSED via 21-UAT.md test 1. During the read-out the user flagged em dashes throughout the copy; these were removed site-wide (Holloway body + all project case-study source fences) and the body re-read cleanly. User approved with `pass`. See 21-UAT.md Gaps G1 for the full fix record.

### Gaps Summary

No gaps found. All 4 roadmap Success Criteria are independently verified against the running codebase (not just SUMMARY claims):

- **SC1** (idempotent sync mirroring sync-projects.mjs): verified via direct script read, `pnpm sync:experience:check` exit 0 against real repo state, and 3 dedicated Vitest files (unit, `--check` drift, write-mode idempotency) all passing.
- **SC2** (typed frontmatter validated at build): verified via `pnpm exec astro check` (0 errors) and direct schema read confirming the exact optionality edges (`endDate` optional, `techStack` no `.min`, `highlights.max(5)` no min).
- **SC3** (reverse-chronological ordering contract): verified via direct read of `src/lib/experience.ts` (pure, non-mutating, generic helper) and its dedicated unit tests — delivered as the reusable helper per review finding #3 option (a), not as a rendered query, matching the explicit phase scope split (Experience page is Phase 22).
- **SC4** (`pnpm build` succeeds, no new deps): verified via a real `pnpm build` run (exit 0) and a direct `package.json` dependency count (11 runtime / 12 dev, unchanged).

The only open item is a pre-flagged, non-blocking human content-quality check on the Holloway MDX body, which routes this phase to `human_needed` rather than `passed` per the verification decision tree (any human verification item present precludes a clean `passed`, regardless of all other truths verifying).

---

_Verified: 2026-07-09T09:06:30Z_
_Verifier: Claude (gsd-verifier)_
