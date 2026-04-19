---
phase: 13
plan: 04
type: execute
wave: 3
depends_on: [02]
files_modified:
  - src/content/projects/crypto-breakout-trader.mdx
  - src/content/projects/daytrade.mdx
  - src/content/projects/seatwatch.mdx
  - src/content/projects/nfl-predict.mdx
  - src/content/projects/solsniper.mdx
  - src/content/projects/optimize-ai.mdx
  - src/content/projects/clipify.mdx
  - src/data/portfolio-context.json
  - src/data/about.ts
autonomous: true
requirements: [CONT-04, CONT-05]
must_haves:
  truths:
    - "src/content/projects/crypto-breakout-trader.mdx no longer exists; src/content/projects/daytrade.mdx exists with title 'Daytrade'"
    - "All 6 MDX files have a frontmatter `source:` field pointing to a real Projects/<n>-<NAME>.md file"
    - "src/data/portfolio-context.json no longer references 'crypto-breakout-trader' anywhere; the corresponding entry is renamed 'Daytrade' with page '/projects/daytrade'"
    - "src/data/about.ts has `/* Verified: 2026-MM-DD */` annotations adjacent to all four exports (D-18)"
    - "`pnpm check` passes (Zod schema accepts all 6 entries with new source: field)"
    - "Plan 01 source-files-exist.test.ts and Plan 01 sync-projects --check no longer error on missing source: field (still RED on body H2 shape and content — closed by Wave 4)"
  artifacts:
    - path: "src/content/projects/daytrade.mdx"
      provides: "Renamed project (was crypto-breakout-trader.mdx); Zod-valid frontmatter with `source: \"Projects/6 - DAYTRADE.md\"`"
      contains: "source: \"Projects/6 - DAYTRADE.md\""
    - path: "src/data/portfolio-context.json"
      provides: "Patched project entry: name 'Daytrade', page '/projects/daytrade', tech list matching new MDX frontmatter"
      contains: "/projects/daytrade"
    - path: "src/data/about.ts"
      provides: "Dated /* Verified: */ annotations on all four exports per D-18"
      contains: "Verified:"
  key_links:
    - from: "src/content/projects/*.mdx"
      to: "Projects/<n>-<NAME>.md"
      via: "frontmatter source: field"
      pattern: "^source: \"Projects/"
    - from: "src/data/portfolio-context.json"
      to: "src/pages/api/chat.ts"
      via: "import statement (D-26 trigger)"
      pattern: "portfolio-context\\.json"
---

<objective>
Execute the crypto-breakout-trader → daytrade rename, add the `source:` frontmatter field to all 6 MDX files (closing the Zod RED state from Plan 02), patch `src/data/portfolio-context.json` to match the new slug + name, and add D-18 dated `/* Verified: */` annotations to `src/data/about.ts`.

Purpose: This plan delivers two CONT requirements:
- **CONT-05** (Projects/ as authoritative source): every MDX now declares its source: file
- **CONT-04** (homepage / work list rename): /projects/daytrade replaces /projects/crypto-breakout-trader and the chat context JSON stays in lockstep

This plan does NOT yet rewrite the case-study bodies — Wave 4 owns body content. This plan is the structural / wiring layer that the body-content plans depend on (their MDX file paths and source: field values must be locked first).

Output: 6 MDX files with source: fields; 1 file renamed; portfolio-context.json patched; about.ts annotated; `pnpm check` GREEN; sync-projects --check no longer errors on missing source field (errors will move to "fence not found in source" — Wave 4 closes those).

**D-26 Chat Regression Gate is TRIGGERED by the portfolio-context.json edit. The full battery runs in Plan 09 (phase gate), but a quick smoke test ("Daytrade" project query through the local dev server) is performed at the end of this plan as an early-warning signal.**
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md
@.planning/phases/13-content-pass-projects-sync/13-RESEARCH.md
@.planning/phases/13-content-pass-projects-sync/13-PATTERNS.md
@.planning/phases/13-content-pass-projects-sync/13-VALIDATION.md
@src/content/projects/crypto-breakout-trader.mdx
@src/content/projects/seatwatch.mdx
@src/content/projects/nfl-predict.mdx
@src/content/projects/solsniper.mdx
@src/content/projects/optimize-ai.mdx
@src/content/projects/clipify.mdx
@src/data/portfolio-context.json
@src/data/about.ts
@src/pages/api/chat.ts

<interfaces>
<!-- After this plan, every MDX in src/content/projects/ has this frontmatter shape: -->
```yaml
---
title: "..."
tagline: "..."
description: "..."
techStack: [...]
featured: true|false
status: "completed"
category: "..."
order: N
year: "YYYY"
demoUrl: "..." (optional)
githubUrl: "..." (optional)
source: "Projects/<n>-<NAME>.md"   ← NEW (D-15)
---
```

<!-- Slug-to-source mapping (locked by D-04 / RESEARCH "Source-of-Truth Content"): -->
seatwatch.mdx       → Projects/1 - SEATWATCH.md
nfl-predict.mdx     → Projects/2 - NFL_PREDICT.md
solsniper.mdx       → Projects/3 - SOLSNIPER.md
optimize-ai.mdx     → Projects/4 - OPTIMIZE_AI.md
clipify.mdx         → Projects/5 - CLIPIFY.md
daytrade.mdx        → Projects/6 - DAYTRADE.md (post-rename)

<!-- portfolio-context.json target shape for the daytrade entry (lines 51-56 today): -->
```json
    {
      "name": "Daytrade",
      "description": "<must match daytrade.mdx frontmatter description field byte-for-byte>",
      "tech": [<must match daytrade.mdx techStack array byte-for-byte>],
      "page": "/projects/daytrade"
    }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: git mv crypto-breakout-trader.mdx → daytrade.mdx and rewrite its frontmatter</name>
  <files>src/content/projects/crypto-breakout-trader.mdx, src/content/projects/daytrade.mdx</files>
  <read_first>
    - src/content/projects/crypto-breakout-trader.mdx (current frontmatter — preserve techStack array, status, featured, category, order, year byte-for-byte where applicable; rewrite title + description)
    - Projects/6 - DAYTRADE.md (canonical project description — use this to derive the new MDX frontmatter `description` field; do NOT use the old AI-drafted MDX description as the source of truth)
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH "Runtime State Inventory" lines 375-383 — the explicit 7-step rename checklist)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"src/content/projects/crypto-breakout-trader.mdx → daytrade.mdx" — Pattern 1 frontmatter byte preservation; S5 astro check after rename)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-04 rename mandatory; D-05 no redirect needed)
  </read_first>
  <behavior>
    Step 1: Rename the file using `git mv` to preserve history.
    Step 2: Rewrite the daytrade.mdx frontmatter:
    - title: "Daytrade" (was "Crypto Breakout Trader")
    - description: a 1-2-sentence accurate summary derived from `Projects/6 - DAYTRADE.md` (the actual project README), NOT from the old AI-drafted description. Acceptable starter form (verify against DAYTRADE.md before committing): `"An automated cryptocurrency day-trading system implementing momentum breakout detection on 5-minute candles, with composable signal filters, risk-based position sizing, and atomic state persistence."` — the existing description is approximately right; refine if Projects/6 - DAYTRADE.md disagrees.
    - source: "Projects/6 - DAYTRADE.md" (NEW field, required by D-15 / Plan 02 schema)
    - Preserve techStack, featured, status, category, order, year byte-for-byte from the existing file.
    Step 3: Body content stays as-is for now (Wave 4 Plan 07 rewrites the body to the 5-H2 shape). The placeholder body must remain so the file is not empty (Zod doesn't validate body content; tests will be RED for shape until Plan 07).
    Step 4: Run `pnpm check` to clear .astro/data-store.json and validate Zod (S5).
    Step 5: Run `pnpm build` to confirm `dist/client/projects/daytrade/` exists and `dist/client/projects/crypto-breakout-trader/` does NOT (clean any stale dist/ first).
  </behavior>
  <action>
    From the project root, run:

    ```bash
    git mv "src/content/projects/crypto-breakout-trader.mdx" "src/content/projects/daytrade.mdx"
    ```

    Verify with `git status` that the rename is recorded as a rename (not delete + add). If git's heuristic fails to detect rename (unlikely — content is identical), the rename still works for filesystem purposes.

    Now edit `src/content/projects/daytrade.mdx`. Read the current frontmatter; identify these exact lines that need changes:
    - `title: "Crypto Breakout Trader"` → `title: "Daytrade"`
    - `description: "An automated cryptocurrency day-trading system…"` → confirm the description matches `Projects/6 - DAYTRADE.md`'s subject; refine if needed (read DAYTRADE.md first 30 lines).
    - Add a new line `source: "Projects/6 - DAYTRADE.md"` immediately before the closing `---` of the frontmatter block.
    - Do NOT modify techStack, featured, status, category, order, year — preserve byte-for-byte.

    For the other fields, preserve the original file's exact bytes (S1: frontmatter byte-range preservation principle still applies for hand-edits — only change what must change). Use the Edit tool with surgical OLD/NEW strings, NOT a full file rewrite.

    After the edit, run cleanup + validation:
    ```bash
    rm -rf .astro/                            # clear content cache (Pitfall 1)
    pnpm check                                # astro check; should still complain about missing source on the OTHER 5 files
    rm -rf dist/                              # clean any stale build output
    pnpm build                                # full build
    test -d dist/client/projects/daytrade && echo "daytrade route OK"
    test ! -d dist/client/projects/crypto-breakout-trader && echo "old route gone"
    ```

    pnpm check WILL still fail on the remaining 5 files (no source: yet). That's expected; Tasks 2-3 of this plan close it. The Zod check should specifically PASS for daytrade.mdx (it now has source:) and FAIL for the other 5.
  </action>
  <acceptance_criteria>
    - File `src/content/projects/crypto-breakout-trader.mdx` does NOT exist (verify: `test ! -f src/content/projects/crypto-breakout-trader.mdx`).
    - File `src/content/projects/daytrade.mdx` exists (verify: `test -f src/content/projects/daytrade.mdx`).
    - daytrade.mdx contains `title: "Daytrade"` (verify: `grep -c '^title: "Daytrade"' src/content/projects/daytrade.mdx` returns 1).
    - daytrade.mdx contains `source: "Projects/6 - DAYTRADE.md"` (verify: `grep -c 'source: "Projects/6 - DAYTRADE.md"' src/content/projects/daytrade.mdx` returns 1).
    - daytrade.mdx does NOT contain "Crypto Breakout Trader" anywhere (verify: `grep -c "Crypto Breakout Trader" src/content/projects/daytrade.mdx` returns 0).
    - git records the rename (verify: `git status --porcelain | grep -c "^R "` for the renamed pair returns ≥ 1, OR `git diff --stat --cached` shows the rename pair). If git records as delete+add instead of rename, document in SUMMARY but accept; outcome is identical at filesystem level.
    - `pnpm build` produces `dist/client/projects/daytrade/index.html` (verify: `test -f dist/client/projects/daytrade/index.html` after build) AND does NOT produce `dist/client/projects/crypto-breakout-trader/` (verify: `test ! -d dist/client/projects/crypto-breakout-trader`).
  </acceptance_criteria>
  <verify>
    <automated>test ! -f src/content/projects/crypto-breakout-trader.mdx && test -f src/content/projects/daytrade.mdx && grep -q 'source: "Projects/6 - DAYTRADE.md"' src/content/projects/daytrade.mdx && echo OK</automated>
  </verify>
  <done>The MDX file is renamed, frontmatter has new title/description/source, no "Crypto Breakout Trader" string remains in the file, and `pnpm build` produces only the new route (not the old one).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add `source:` frontmatter field to the other 5 MDX files</name>
  <files>src/content/projects/seatwatch.mdx, src/content/projects/nfl-predict.mdx, src/content/projects/solsniper.mdx, src/content/projects/optimize-ai.mdx, src/content/projects/clipify.mdx</files>
  <read_first>
    - src/content/projects/seatwatch.mdx (current frontmatter — note hand-formatted multi-line techStack array; preserve byte-for-byte per S1)
    - src/content/projects/nfl-predict.mdx
    - src/content/projects/solsniper.mdx
    - src/content/projects/optimize-ai.mdx
    - src/content/projects/clipify.mdx
    - Projects/1 - SEATWATCH.md (verify file exists at the path you'll write into source:)
    - Projects/2 - NFL_PREDICT.md
    - Projects/3 - SOLSNIPER.md
    - Projects/4 - OPTIMIZE_AI.md
    - Projects/5 - CLIPIFY.md
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Shared Pattern S1 frontmatter byte-range — surgical edits only)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-15 source: required field)
  </read_first>
  <behavior>
    For each of the 5 MDX files, add a single `source:` line to the frontmatter immediately before the closing `---`. Preserve every other byte of the file (frontmatter formatting, body content, final newline) exactly as-is.

    Slug-to-source mapping (locked):
    - seatwatch.mdx     → `source: "Projects/1 - SEATWATCH.md"`
    - nfl-predict.mdx   → `source: "Projects/2 - NFL_PREDICT.md"`
    - solsniper.mdx     → `source: "Projects/3 - SOLSNIPER.md"`
    - optimize-ai.mdx   → `source: "Projects/4 - OPTIMIZE_AI.md"`
    - clipify.mdx       → `source: "Projects/5 - CLIPIFY.md"`

    After all 5 edits, `pnpm check` MUST PASS (all 6 MDX files now have source:; Zod accepts all). `node scripts/sync-projects.mjs --check` will now error differently — instead of "missing source: field", it should error "missing CASE-STUDY-START" because the Projects/*.md files don't yet have the fence (Wave 4 closes that). That is the desired RED-state-of-Wave-4 boundary.
  </behavior>
  <action>
    For each of the 5 files, use the Edit tool with surgical OLD/NEW pairs. Pattern (example for seatwatch.mdx):

    OLD (last line of frontmatter before the closing `---`):
    ```
    demoUrl: "https://seat.watch"
    ---
    ```

    NEW (insert source: immediately before the `---`):
    ```
    demoUrl: "https://seat.watch"
    source: "Projects/1 - SEATWATCH.md"
    ---
    ```

    Per-file last-line-before-closing-`---` reference (READ each file first to confirm — frontmatter shapes vary):
    - seatwatch.mdx: last line is `demoUrl: "https://seat.watch"` (verified during planning)
    - nfl-predict.mdx, solsniper.mdx, optimize-ai.mdx, clipify.mdx: read each before editing; the last frontmatter line varies (some have githubUrl, some demoUrl, some both, some neither). DO NOT assume — read first.

    The placement choice (right before `---`) keeps the diff minimal and mirrors the daytrade.mdx pattern from Task 1. Acceptable alternate placement: any line within the frontmatter block — Zod is order-agnostic. But pick ONE consistent placement (last line before `---`) for all 6 files per Pattern 1 / consistency.

    After each edit, do NOT re-format the rest of the frontmatter. Multi-line techStack arrays (like seatwatch's) stay multi-line. Single-line techStacks stay single-line.

    After all 5 edits:
    ```bash
    pnpm check                              # Zod must pass for all 6 entries now
    node scripts/sync-projects.mjs --check  # Must error on something OTHER than "missing source" — typically "missing CASE-STUDY-START" since Wave 4 hasn't added fences to Projects/*.md yet
    pnpm test tests/content/source-files-exist.test.ts  # Must pass GREEN — every source: points to a real file
    ```
  </action>
  <acceptance_criteria>
    - All 5 files contain `source: "Projects/` (verify: `grep -c '^source: "Projects/' src/content/projects/seatwatch.mdx src/content/projects/nfl-predict.mdx src/content/projects/solsniper.mdx src/content/projects/optimize-ai.mdx src/content/projects/clipify.mdx` returns 5).
    - Per-file source: values are correct (verify each):
      - `grep -c '^source: "Projects/1 - SEATWATCH.md"' src/content/projects/seatwatch.mdx` returns 1
      - `grep -c '^source: "Projects/2 - NFL_PREDICT.md"' src/content/projects/nfl-predict.mdx` returns 1
      - `grep -c '^source: "Projects/3 - SOLSNIPER.md"' src/content/projects/solsniper.mdx` returns 1
      - `grep -c '^source: "Projects/4 - OPTIMIZE_AI.md"' src/content/projects/optimize-ai.mdx` returns 1
      - `grep -c '^source: "Projects/5 - CLIPIFY.md"' src/content/projects/clipify.mdx` returns 1
    - `pnpm check` exits 0 (verify: `pnpm check 2>&1; echo "exit=$?"` shows exit=0 — Zod now passes for all 6 MDX files).
    - `pnpm test tests/content/source-files-exist.test.ts` passes GREEN.
    - Per-file diff is minimal — only the source: line was added (verify: `git diff src/content/projects/seatwatch.mdx | grep -E "^[+-]" | grep -v "^[+-]{3}" | wc -l` returns 1 for each file; only one + line added).
  </acceptance_criteria>
  <verify>
    <automated>pnpm check 2>&1; CHK_EXIT=$?; pnpm test tests/content/source-files-exist.test.ts 2>&1 | tail -10; if [ $CHK_EXIT -eq 0 ]; then echo "OK"; exit 0; else exit 1; fi</automated>
  </verify>
  <done>All 5 remaining MDX files have correct source: frontmatter; pnpm check passes; source-files-exist.test.ts is GREEN; sync-projects --check now errors on a different problem (missing fence in Projects/*.md — Wave 4 closes that).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Patch portfolio-context.json daytrade entry + add D-18 dated annotations to about.ts</name>
  <files>src/data/portfolio-context.json, src/data/about.ts</files>
  <read_first>
    - src/data/portfolio-context.json (current file; lines 51-56 contain the old "Crypto Breakout Trader" block; lines 19-26 are the canonical SeatWatch entry shape to mirror)
    - src/data/about.ts (current file; 4 export const declarations on lines 6-7, 9-10, 12-13, 15-16)
    - src/content/projects/daytrade.mdx (post-Task-1 state; the description and techStack values from its frontmatter must be copied verbatim into portfolio-context.json — D-26 lockstep requirement)
    - src/pages/api/chat.ts (line 6 imports portfolio-context.json — read to confirm the import shape; do NOT edit this file)
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH "Runtime State Inventory" lines 366-373 grep results; Pitfall 5 D-26 trigger)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"src/data/portfolio-context.json" canonical SeatWatch shape; PATTERNS §"src/data/about.ts" comment placement)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-18 dated annotation mechanism; D-04 rename includes nav/work-list/internal links — portfolio-context.json is one such internal link surface; D-26 chat regression gate)
  </read_first>
  <behavior>
    File 1 — src/data/portfolio-context.json:
    Replace lines 51-56 (the "Crypto Breakout Trader" block) with a Daytrade block matching the SeatWatch entry's shape (lines 19-26 are the canonical 4-field block: name, description, tech, page; SeatWatch additionally has url because it has a demoUrl; Daytrade does not have a public URL so omit url field unless daytrade.mdx has demoUrl — it does not).

    Target Daytrade block (description and tech MUST match daytrade.mdx frontmatter byte-for-byte per D-26 lockstep):
    ```json
        {
          "name": "Daytrade",
          "description": "<copy daytrade.mdx description: field verbatim>",
          "tech": [<copy daytrade.mdx techStack array verbatim, JSON-format>],
          "page": "/projects/daytrade"
        }
    ```

    Confirm AFTER edit:
    - `grep -c "crypto-breakout" src/data/portfolio-context.json` returns 0 (no old slug references remain)
    - `grep -c "Crypto Breakout" src/data/portfolio-context.json` returns 0 (no old name references remain)
    - The file is valid JSON (verify by parsing)

    File 2 — src/data/about.ts:
    Add a `/* Verified: 2026-MM-DD */` comment line immediately above EACH `export const` declaration. Use today's actual phase-execution date (the executor reads the date from `date +%Y-%m-%d` at execute time, NOT planning date 2026-04-16 — D-18 says "git blame on the annotation is the durable evidence", so the timestamp must reflect when verification happened).

    Result shape:
    ```typescript
    /**
     * About page copy -- single source of truth.
     * ...
     */
    /* Verified: 2026-MM-DD */
    export const ABOUT_INTRO = "...";

    /* Verified: 2026-MM-DD */
    export const ABOUT_P1 = "...";

    /* Verified: 2026-MM-DD */
    export const ABOUT_P2 = "...";

    /* Verified: 2026-MM-DD */
    export const ABOUT_P3 = "...";
    ```

    Do NOT modify the export const string contents. Do NOT modify the file header comment. Do NOT add/remove blank lines except the one required for each comment placement.

    After all edits:
    - `pnpm test` (full suite) — confirm no regression in tests/client/about-data.test.ts (the test asserts string content; the comment additions don't affect the constant values).
    - `pnpm check` — still passes.
    - `pnpm build` — still passes; the new portfolio-context.json shape is a superset-compatible patch.
    - **D-26 smoke test (early warning)**: open the local dev server with `pnpm dev`, visit the chat widget, ask "What did Jack build for Daytrade?". Verify the response references the Daytrade project (not "Crypto Breakout Trader" and not "I don't know"). This is a smoke test only — the FULL Phase 7 regression battery runs in Plan 09 (phase gate). Document the smoke result in SUMMARY.md.
  </behavior>
  <action>
    File 1 — src/data/portfolio-context.json:

    Use Edit with this surgical OLD/NEW (verify the OLD string by reading the file first; the en-dashes in description and the exact tech list must match):

    OLD (lines 51-56, the entire daytrade entry block — copy bytes from the file via Read first):
    ```json
        {
          "name": "Crypto Breakout Trader",
          "description": "An automated cryptocurrency day-trading system implementing momentum breakout detection on 5-minute candles with composable signal filters, risk-based position sizing, and atomic state persistence.",
          "tech": ["Python", "CCXT", "pandas", "pandas-ta", "Pydantic"],
          "page": "/projects/crypto-breakout-trader"
        }
    ```

    NEW (replace with — description and tech must match Task 1's daytrade.mdx values):
    ```json
        {
          "name": "Daytrade",
          "description": "<EXACT description from daytrade.mdx frontmatter — copy after Task 1 lands>",
          "tech": [<EXACT techStack from daytrade.mdx frontmatter — JSON-format>],
          "page": "/projects/daytrade"
        }
    ```

    The `<EXACT description>` and `<EXACT techStack>` placeholders MUST be filled with the actual values from daytrade.mdx after Task 1 completes. If Task 1's description and techStack happen to be byte-identical to the old (which is likely for techStack), then only name + page strings change.

    Verify JSON is well-formed:
    ```bash
    node -e "JSON.parse(require('fs').readFileSync('src/data/portfolio-context.json', 'utf8'))"
    ```
    Exits 0 with no output = valid JSON.

    File 2 — src/data/about.ts:

    Capture today's date: `TODAY=$(date +%Y-%m-%d)` — use this exact value (NOT 2026-04-16 from the planning session) for all four annotations.

    Use Edit with four OLD/NEW pairs. Each OLD is the existing `export const ...` line; each NEW prepends `/* Verified: $TODAY */\n` to it.

    Example (ABOUT_INTRO):
    OLD:
    ```typescript
    export const ABOUT_INTRO =
      "I'm Jack \u2014 a junior software engineer who likes building systems that don't break at 3\u00a0a.m.";
    ```
    NEW:
    ```typescript
    /* Verified: 2026-MM-DD */
    export const ABOUT_INTRO =
      "I'm Jack \u2014 a junior software engineer who likes building systems that don't break at 3\u00a0a.m.";
    ```
    (Replace 2026-MM-DD with `$TODAY` value.)

    Repeat for ABOUT_P1, ABOUT_P2, ABOUT_P3.

    D-26 early-warning smoke check (HUMAN sub-step, not automated — `pkill` is unreliable on Windows + Git Bash):

    This sub-step is a checkpoint:human-verify checkpoint inside the task. Do NOT script the dev server lifecycle from CLI. Instead, present these instructions to Jack and pause for confirmation:

    1. In a separate terminal, Jack starts the dev server: `pnpm dev` (he leaves it running).
    2. Jack opens `http://localhost:4321`, opens the chat widget, and asks: "What did Jack build for Daytrade?"
    3. Jack confirms the response mentions "Daytrade" (and does NOT say "Crypto Breakout Trader").
    4. Jack stops the dev server with Ctrl-C in his terminal (no `pkill`, no `taskkill`).
    5. Jack reports the outcome (PASS / NEEDS-CHECKING / FAIL) which Claude records in SUMMARY.md.

    This is an early-warning smoke check ONLY. The binding D-26 regression gate lives in Plan 09 Task 1 — that is where the full Phase 7 chat regression battery runs. If this smoke fails, surface the failure but continue toward Plan 09; the Plan 09 gate is the authoritative D-26 signoff.
  </action>
  <acceptance_criteria>
    - portfolio-context.json contains `"name": "Daytrade"` (verify: `grep -c '"name": "Daytrade"' src/data/portfolio-context.json` returns 1).
    - portfolio-context.json contains `"page": "/projects/daytrade"` (verify: `grep -c '"page": "/projects/daytrade"' src/data/portfolio-context.json` returns 1).
    - portfolio-context.json does NOT contain "Crypto Breakout" or "crypto-breakout" (verify: `grep -ic "crypto-breakout\\|Crypto Breakout" src/data/portfolio-context.json` returns 0).
    - portfolio-context.json is valid JSON (verify: `node -e "JSON.parse(require('fs').readFileSync('src/data/portfolio-context.json', 'utf8')); console.log('valid')"` prints "valid").
    - portfolio-context.json daytrade description matches daytrade.mdx description (verify both contain identical string OR document diff in SUMMARY).
    - about.ts has 4 `Verified:` comments (verify: `grep -c "/\\* Verified:" src/data/about.ts` returns 4).
    - about.ts Verified comments use a real date (YYYY-MM-DD format, NOT the literal "MM-DD") — verify: `grep -cE "/\\* Verified: 2026-[0-9]{2}-[0-9]{2} \\*/" src/data/about.ts` returns 4.
    - about.ts export const string values are unchanged from pre-edit (verify: `git diff src/data/about.ts | grep -E "^[+-]" | grep -v "^[+-]{3}" | grep -vc "Verified:"` returns 0 — only Verified: lines added; no other content changed).
    - tests/client/about-data.test.ts still passes GREEN.
    - `pnpm check` passes.
    - `pnpm build` passes; produces `dist/client/projects/daytrade/index.html`.
    - D-26 smoke result recorded in SUMMARY.md (PASS / NEEDS-CHECKING / FAIL with details).
  </acceptance_criteria>
  <verify>
    <automated>node -e "JSON.parse(require('fs').readFileSync('src/data/portfolio-context.json', 'utf8')); console.log('valid JSON')" && grep -c "/\\* Verified:" src/data/about.ts | awk '{ if ($1 == 4) exit 0; else exit 1 }' && pnpm test tests/client/about-data.test.ts 2>&1 | tail -5</automated>
  </verify>
  <done>portfolio-context.json patched (no old slug remnants, valid JSON, daytrade entry mirrors SeatWatch shape); about.ts has 4 dated Verified: annotations; pnpm test for about-data still passes; D-26 smoke test result recorded.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| MDX frontmatter→Zod validator | New source: field is validated for string shape only; file existence is sync-script's job (Pitfall 7) |
| portfolio-context.json→chat.ts | chat.ts imports this JSON and bakes it into the system prompt; any edit triggers D-26 chat regression (S4) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-04 | Tampering / Information Disclosure | src/data/portfolio-context.json (chat-context source) | mitigate | Verify JSON validity post-edit (`JSON.parse` smoke check); D-26 smoke test confirms chat answers Daytrade query correctly; full Phase 7 regression battery runs in Plan 09 |
| T-13-05 | Repudiation | src/data/about.ts D-18 dated annotations | mitigate | Date stamped via `date +%Y-%m-%d` at execute time (NOT hardcoded planning date); git blame is the durable evidence per D-18 |

T-13-01, T-13-02, T-13-03 do not apply directly — sync script and CI workflow are owned by Plan 02; this plan only edits content + data files, not script paths.
</threat_model>

<verification>
After this plan runs:
- `pnpm check` exits 0 (Zod schema accepts all 6 entries with new source: field)
- `pnpm test tests/content/source-files-exist.test.ts` is GREEN
- `pnpm build` produces `dist/client/projects/daytrade/` and not the old route
- portfolio-context.json is valid JSON with no old slug references
- about.ts has 4 D-18 dated Verified: annotations
- D-26 chat regression smoke test passes (full battery deferred to Plan 09)

Verification commands:
```bash
pnpm check                                    # exit 0
pnpm test tests/content/source-files-exist.test.ts
pnpm build && test -d dist/client/projects/daytrade
grep -c "Crypto Breakout\\|crypto-breakout" src/data/portfolio-context.json   # 0
grep -c "/\\* Verified:" src/data/about.ts    # 4
```
</verification>

<success_criteria>
- [ ] crypto-breakout-trader.mdx renamed to daytrade.mdx; frontmatter rewritten (title, description, source); body left for Wave 4
- [ ] All 6 MDX files have a `source:` field pointing to a real Projects/<n>-<NAME>.md
- [ ] portfolio-context.json has no "crypto-breakout-trader" or "Crypto Breakout Trader" references; daytrade entry is byte-lockstep with daytrade.mdx
- [ ] about.ts has 4 D-18 dated Verified: annotations using actual execution date
- [ ] pnpm check passes, pnpm build produces correct routes
- [ ] D-26 chat smoke result recorded
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-04-daytrade-rename-and-anchors-SUMMARY.md` documenting:
- Confirmation of all 6 MDX source: values (slug → source path table)
- portfolio-context.json daytrade entry shape post-edit
- The actual `Verified: 2026-MM-DD` date used in about.ts
- D-26 smoke test outcome (PASS / NEEDS-CHECKING / FAIL with screenshots or transcript)
- Any unexpected diff in techStack between old portfolio-context.json and new daytrade.mdx (if any)
</output>
