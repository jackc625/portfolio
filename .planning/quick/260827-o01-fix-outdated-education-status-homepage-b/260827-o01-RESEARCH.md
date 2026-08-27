# Quick Task o01: Fix Outdated Education Status - Research

**Researched:** 2026-08-27
**Domain:** Content/copy correction across site copy + chat knowledge corpus (no new deps, no new patterns)
**Confidence:** HIGH (every finding read directly from the file this session)

## Summary

The degree status is wrong in exactly **five hand-edited source files** plus **one generated artifact**. The good news: the copy is already single-sourced. `src/data/about.ts` feeds BOTH the homepage and `/about` (one edit fixes both surfaces), and `src/data/education.ts` is the declared SSoT for the education block, the JSON-LD Person schema, AND the chat corpus education object.

The one non-obvious hazard is that `src/data/portfolio-context.json` is **generated**, and CI (`.github/workflows/sync-check.yml:48`) runs `pnpm build:chat-context:check`, which exits 1 on drift. So the regeneration step is mandatory, not optional.

Second hazard: the literal string `"May 2026"` appears in the codebase for **two unrelated facts** - the graduation date AND the Holloway contract start date (`May 2026 – Present`). A blind find/replace would corrupt the experience data. Four of the ten `"May 2026"` hits must NOT be touched.

**Primary recommendation:** Edit 5 source files, delete 1 rendered line + its CSS rule, run `pnpm build:chat-context` to regenerate the corpus, update 4 test assertions. No dependency changes, no schema changes, no chat-surface (D-26 gated) files touched.

## Project Constraints (from CLAUDE.md / memory)

| Constraint | Impact on this task |
|-----------|---------------------|
| Zero em dashes (U+2014) site-wide; en dashes OK | All proposed replacement copy is em-dash-free. Gate: `tests/content/site-copy-em-dash.test.ts` scans `about.ts`, `education.ts`, `about.astro`, `index.astro`, `ContactSection.astro` [VERIFIED: tests/content/site-copy-em-dash.test.ts:28-34] |
| Register banlist: `junior` / `senior` / `5+ years` in `about.ts`, `about.astro`, `index.astro` | "Expected September 2026" and "I'm finishing" trip none of them [VERIFIED: tests/content/site-copy-em-dash.test.ts:39-44] |
| All visual/UI/UX decisions route through frontend-design skill | Removing the `.education-transfer` line is a *content* removal, but it deletes a rendered element + CSS rule. See "Design note" below - no spacing orphan results, but flag for a quick visual sign-off. |
| Site copy = first person; chat = third person (CHAT-06) | Two separate edits required: `about.ts` (first person) AND `about-chat.ts` (third person). A build-time leak guard hard-fails on crossover. |
| GSD workflow enforcement | This is a `/gsd-quick` task - satisfied. |

## Source-of-Truth vs. Generated (read this before editing)

| File | Status | Notes |
|------|--------|-------|
| `src/data/education.ts` | **SSoT** | Feeds `/about` render, `index.astro` JSON-LD, AND the chat corpus via `parseEducation()` [VERIFIED: src/data/education.ts:1-17, scripts/build-chat-context.mjs:692-699] |
| `src/data/about.ts` | **SSoT** (first person) | Consumed by `about.astro:15` and `index.astro:140` - one edit fixes both surfaces |
| `src/data/about-chat.ts` | **SSoT** (third person) | Consumed ONLY by `scripts/build-chat-context.mjs` |
| `src/data/portfolio-context.static.json` | **SSoT** (hand-curated identity) | `personal.summary` is merged verbatim into the corpus [VERIFIED: scripts/build-chat-context.mjs:632-635, 704-712] |
| `src/data/portfolio-context.json` | **GENERATED - do not hand-edit** | Produced by `pnpm build:chat-context`; CI drift-checked |
| `src/content/experience/holloway.mdx` | GENERATED from `Experience/*.md` via `scripts/sync-experience.mjs` | **Not in scope** - its `May 2026` is the job start date |

## Change Set

### 1. Homepage + About bio paragraph (first person)

**File:** `src/data/about.ts` line 16 [VERIFIED: src/data/about.ts:15-16]

Current (verbatim):
```
"These days I build and stabilize production systems for real users. I’m currently the solo contract engineer on Holloway Connect, a live operations platform, and I recently finished my B.S. in Computer Science. Most of my projects start as “I wonder how that actually works” and end as something I’d be comfortable handing off to a team."
```

Change: `and I recently finished my B.S. in Computer Science.` -> `and I’m finishing my B.S. in Computer Science.`

**Critical:** the file uses typographic apostrophes **U+2019 (’)**, not ASCII `'` [VERIFIED: byte-level `od -c` on line 16 this session - `342 200 231`]. Write `I’m`, not `I'm`, or the copy will render inconsistently with the adjacent `I’m currently`.

Notes:
- This one edit covers BOTH the homepage (`src/pages/index.astro:140` renders `{ABOUT_P1}`) and `/about` (`src/pages/about.astro:15`). No page edits needed.
- Optional smoothing: the sentence now reads "I’m currently the solo contract engineer ... and I’m finishing my B.S." - two `I’m`s. Acceptable, but if Jack prefers, `and finishing my B.S. in Computer Science` also works and is shorter. Recommend keeping the explicit `I’m finishing` per the task wording.
- Word-count gate: `ABOUT_P1` must be <= 80 words [VERIFIED: tests/client/about-data.test.ts:20-22]. The change removes a word - no risk.

### 2. Chat bio paragraph (third person)

**File:** `src/data/about-chat.ts` line 24 [VERIFIED: src/data/about-chat.ts:23-24]

Current (verbatim):
```
"Jack builds and stabilizes production systems for real users. He is currently the solo contract engineer on Holloway Connect, a live operations platform, and recently finished his B.S. in Computer Science. Most of his projects start as “how does that actually work?” and end as something he would be comfortable handing off to a team."
```

Change: `and recently finished his B.S. in Computer Science.` -> `and is finishing his B.S. in Computer Science.`

Leak-guard check: `is finishing his` trips neither `FIRST_PERSON_LEAK_RE` nor `NEVER_BEGINS_FIRST_PERSON` [VERIFIED: scripts/build-chat-context.mjs:102, 119].

### 3. Chat identity summary

**File:** `src/data/portfolio-context.static.json` line 6 (`personal.summary`) [VERIFIED: src/data/portfolio-context.static.json:6]

Current (verbatim):
```
"Software engineer who builds and stabilizes real production systems, not tutorials. Jack is the solo contract engineer on Holloway Connect, a live operations platform, and recently finished his B.S. in Computer Science. Every project in this portfolio exists because he saw a problem and decided to solve it, with a bias toward clean architecture, strong fundamentals, and code that works."
```

Change: `and recently finished his B.S. in Computer Science.` -> `and is finishing his B.S. in Computer Science.`

This string is merged verbatim into the corpus `<knowledge>` block and is covered by the same first-person leak guard [VERIFIED: scripts/build-chat-context.mjs:125-128, 150-152].

### 4. Education SSoT date

**File:** `src/data/education.ts` [VERIFIED: src/data/education.ts:25-38]

Current (verbatim):
```
  /** Display: "May 2026" (human-readable graduation date). */
  date: "May 2026",
  /** Display: prior institution; attended = honest (D-10). alumniOf only. */
  transferredFrom: "Virginia Tech",
  /** Schema-only: unabbreviated degree name for hasCredential.name. */
  degreeSchemaName: "Bachelor of Science in Computer Science",
  /** Schema-only: ISO 8601 (YYYY-MM) for hasCredential.validFrom. */
  dateISO: "2026-05",
```

| Line | Current | New |
|------|---------|-----|
| 30 (comment) | `/** Display: "May 2026" (human-readable graduation date). */` | `/** Display: "Expected September 2026" (human-readable expected graduation date). */` |
| 31 | `date: "May 2026",` | `date: "Expected September 2026",` |
| 37 | `dateISO: "2026-05",` | `dateISO: "2026-09",` |

Because `about.astro:23` renders `{EDUCATION.institution} · {EDUCATION.date}` [VERIFIED: src/pages/about.astro:23], setting `date` to `"Expected September 2026"` produces exactly the requested `Western Governors University · Expected September 2026`. No page edit needed for the date. Separator stays the middot (U+00B7) - zero-em-dash rule holds.

`dateISO` only feeds `hasCredentialSchema[0].validFrom` (JSON-LD) [VERIFIED: src/data/education.ts:66-73]. Update it to `2026-09` for consistency.

### 5. Remove the Virginia Tech transfer line from /about

**File:** `src/pages/about.astro` [VERIFIED: src/pages/about.astro:19-30, 41-48]

Delete line 24:
```
        <p class="education-transfer meta-mono">Transferred from {EDUCATION.transferredFrom}</p>
```

Delete the now-unused CSS rule at line 47:
```
  .education-transfer { color: var(--ink-faint); margin-top: 4px; }
```

**Design note:** the removed element sat between `.education-meta` (no bottom margin) and `.education-cred` (`margin-top: 16px`). Removing it leaves `.education-meta` -> `.education-cred` with the 16px gap intact - no orphaned or collapsed spacing. Visual delta is a single removed faint mono line. Worth a quick eyeball at `/about` after build.

**Keep `EDUCATION.transferredFrom` in `education.ts`** - see Open Questions below.

### 6. Regenerate the chat corpus (MANDATORY)

```bash
pnpm build:chat-context
```

This rewrites `src/data/portfolio-context.json`, updating three lines automatically:

| Line | Current | Becomes |
|------|---------|---------|
| 6 | `personal.summary` with `recently finished his B.S.` | `...is finishing his B.S.` |
| 212 | `"graduation": "May 2026",` | `"graduation": "Expected September 2026",` |
| 220 | `about.p1` with `recently finished his B.S.` | `...is finishing his B.S.` |

[VERIFIED: src/data/portfolio-context.json:6, 212, 220]

**Do NOT hand-edit `portfolio-context.json`.** CI runs `pnpm build:chat-context:check` which exits 1 on drift [VERIFIED: .github/workflows/sync-check.yml:48], and the education object is read from `education.ts` at build time via `parseEducation()` [VERIFIED: scripts/build-chat-context.mjs:397-446, 692-699].

The generated corpus's `est_tokens` value will shift slightly. Nothing asserts a fixed token count in tests [VERIFIED: grep for `est_tokens` returns only `scripts/build-chat-context.mjs:734`], so this is safe.

## Files That Must NOT Be Changed

| File / line | Text | Why it stays |
|-------------|------|--------------|
| `src/content/experience/holloway.mdx:6` | `dateRange: "May 2026 – Present"` | Holloway contract **start** date, not graduation. Also machine-synced from `Experience/*.md` - editing the MDX would fail `pnpm sync:experience:check` in CI. |
| `src/content/experience/holloway.mdx:5` | `startDate: "2026-05"` | Same - job start. |
| `src/data/portfolio-context.json:199` | `"dateRange": "May 2026 – Present"` | Generated from the Holloway MDX. |
| `tests/build/home-teaser-render.test.ts:106` | `expect(eyebrow).toContain("May 2026")` | Asserts the **Holloway teaser eyebrow** date range, not education [VERIFIED: tests/build/home-teaser-render.test.ts:103-107]. |
| `tests/build/parse-education.test.ts:66` | `expect(entry.dateRange).toBe("May 2026 – Present")` | Holloway frontmatter parse test. |
| `src/prompts/system-prompt.ts` | - | Contains **no** education/graduation/VT references [VERIFIED: grep for education\|degree\|B.S\|graduat\|university\|WGU\|Virginia returns 0 hits in system-prompt.ts]. Education reaches the model only through the generated corpus JSON. Nothing to change. |
| `public/jack-cutrara-resume.pdf` | - | Binary asset, no extractable plaintext match. Almost certainly carries "May 2026" and the VT line. **Out of code scope - flag for Jack to re-export manually.** |

## Test Updates Required

| File | Line | Current assertion | New |
|------|------|-------------------|-----|
| `tests/build/about-education-render.test.ts` | 54 | `"May 2026",` | `"Expected September 2026",` |
| `tests/build/about-education-render.test.ts` | 55 | `"Transferred from Virginia Tech",` | **delete the array entry**; rename the `it("renders all four visible education facts")` title to `three` |
| `tests/build/about-education-render.test.ts` | 73 | `expect(bodyText).toContain("finished my B.S. in Computer Science")` | `...toContain("finishing my B.S. in Computer Science")` |
| `tests/content/education-module.test.ts` | 27 | `expect(EDUCATION.date).toBe("May 2026")` | `...toBe("Expected September 2026")` |
| `tests/content/education-module.test.ts` | 35 | `expect(EDUCATION.dateISO).toBe("2026-05")` | `...toBe("2026-09")` |

[VERIFIED: tests/build/about-education-render.test.ts:50-75, tests/content/education-module.test.ts:24-36]

**No change needed** (these compare against the imports dynamically, so they follow the SSoT automatically):
- `tests/build/parse-education.test.ts:44-49` - deep-equals `EDUCATION.*` / `CREDENTIALS`
- `tests/build/chat-context-integrity.test.ts:143-146` - `education?.graduation === EDUCATION.date`
- `tests/content/education-module.test.ts:56-82` - alumniOf/hasCredential relationships

**Only if VT is removed entirely** (not recommended - see Open Questions): `tests/build/home-teaser-render.test.ts:136`, `tests/content/education-module.test.ts:28,56,79-81` would all need rework, plus `education.ts` `alumniOfSchema`, `parseEducation()`, `portfolio-context-types.ts`, and the corpus shape. That is a materially larger change.

## Common Pitfalls

1. **Blind find/replace on `"May 2026"`** - corrupts the Holloway contract dates in 4 places. Change only `education.ts:31`.
2. **Hand-editing `portfolio-context.json`** - CI drift gate fails. Always regenerate.
3. **ASCII apostrophe in `about.ts`** - the file uses U+2019 (`’`). Mixing produces visibly inconsistent typography on two pages.
4. **Editing `holloway.mdx` directly** - it is sync-generated; `pnpm sync:experience:check` will fail.
5. **First-person leak into `about-chat.ts` / `static.json`** - the build hard-exits 2. Third person only in those two files.
6. **`verify-phase24-invariants.mjs` will now fail if run** - its `PROTECTED_FILES` includes `about-chat.ts`, `portfolio-context.json`, `portfolio-context.static.json` [VERIFIED: scripts/verify-phase24-invariants.mjs:35-44]. It is a completed-phase artifact and is **not** wired into `pnpm test` or CI [VERIFIED: grep across tests/ and .github/ returns no invocation], so this is expected and harmless - but do not "fix" it by reverting edits.

## Verification Commands

```bash
pnpm build:chat-context          # regenerate corpus (mandatory)
pnpm build:chat-context:check    # confirm zero drift (mirrors CI)
pnpm sync:check                  # projects sync unaffected, confirm
pnpm sync:experience:check       # experience sync unaffected, confirm
pnpm exec astro check            # expect 0/0/0
pnpm build                       # needed before the dist-render gates
pnpm test                        # full suite
```

`tests/build/about-education-render.test.ts` and `tests/build/home-teaser-render.test.ts` parse built HTML from `dist/` - run `pnpm build` before `pnpm test` or they self-skip.

Manual: load `/` and `/about`, confirm the bio reads "I'm finishing my B.S. in Computer Science" and the education block reads `Western Governors University · Expected September 2026` with no transfer line. Optionally ask the chat widget "when does Jack graduate?" against `astro dev`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The resume PDF contains the stale May 2026 / VT text | Files That Must NOT Be Changed | Low - flagged for manual re-export, not auto-edited. PDF streams are compressed so this could not be confirmed by grep. |
| A2 | `dateISO` should become `2026-09` rather than dropping the degree from `hasCredential` | Change Set 4 | Low - JSON-LD `validFrom` for an expected credential is a soft convention; either is defensible. |

## Open Questions

1. **Should Virginia Tech be removed everywhere, or only from the visible /about line?**
   - What we know: VT lives in 3 places beyond the About line - `EDUCATION.transferredFrom` (`education.ts:33`), the `alumniOfSchema` JSON-LD on the homepage (`education.ts:48-51`, asserted at `tests/build/home-teaser-render.test.ts:136`), and the chat corpus `education.transferredFrom` (`portfolio-context.json:213`).
   - What's unclear: the task says "remove Virginia Tech transfer line," which reads as the visible About line only.
   - **Recommendation: remove only the rendered `/about` line.** Keep `transferredFrom` in `education.ts` (it still powers the honest `alumniOf` structured data, which is invisible to visitors and accurate - he did attend), and keep it in the chat corpus so the bot can answer a direct "did he transfer?" question truthfully. This is the minimal, lowest-risk change: 1 line + 1 CSS rule deleted, 2 test edits. Removing VT everywhere touches ~8 more files including the corpus schema and its TypeScript type.

2. **Does the resume PDF need re-exporting?** It almost certainly carries "May 2026" and the VT line. Not editable in code - needs Jack to regenerate and drop into `public/jack-cutrara-resume.pdf`. Size gate is 10KB-1MB [VERIFIED: tests/content/resume-asset.test.ts:5-18].

## Sources

### Primary (HIGH confidence - files read this session)
- `src/data/about.ts`, `src/data/about-chat.ts`, `src/data/education.ts`
- `src/data/portfolio-context.static.json`, `src/data/portfolio-context.json`
- `src/pages/about.astro`, `src/pages/index.astro`
- `scripts/build-chat-context.mjs` (parseEducation, merge, leak guards)
- `scripts/verify-phase24-invariants.mjs`, `scripts/verify-phase25-invariants.mjs`
- `tests/build/about-education-render.test.ts`, `tests/build/home-teaser-render.test.ts`, `tests/build/parse-education.test.ts`, `tests/build/chat-context-integrity.test.ts`
- `tests/content/education-module.test.ts`, `tests/content/site-copy-em-dash.test.ts`, `tests/client/about-data.test.ts`, `tests/content/resume-asset.test.ts`
- `.github/workflows/sync-check.yml`, `package.json`

## Metadata

**Confidence breakdown:**
- File/line inventory: HIGH - repo-wide grep plus direct reads; the candidate set is exactly 6 source files
- Generated-vs-source classification: HIGH - confirmed from the build script and CI workflow
- Test impact: HIGH - every assertion read verbatim

**Research date:** 2026-08-27
**Valid until:** stable (repo-local facts; invalidated only by edits to these files)
