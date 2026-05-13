---
quick_id: 260513-g96
type: research
---

# RESEARCH — Em dash replacement playbook

## Categories of em dash usage observed in this codebase

1. **Parenthetical aside between two dashes** (most common in MDX prose, ~12 occurrences)
   - `clipify.mdx:27` — "long-form footage — podcasts, streams, YouTube VODs — and repurpose"
   - `clipify.mdx:31` — "BullMQ queues on Upstash Redis connected them — `q_transcribe` ... `q_render` — with per-job timeouts"
   - `nfl-predict.mdx:30` — "three external sources — games via `nflreadpy`, odds via The Odds API, and weather via Open-Meteo"
2. **Single trailing dash introducing elaboration / definition** (very common, ~15 occurrences)
   - `seatwatch.mdx:34` — "Rate-limit and auth errors stay on the API path — a browser retry would not help."
   - `solsniper.mdx:34` — "guarantee exit — strictly worse than a clean STANDARD sell"
   - `daytrade.mdx:17` — "ignored the surrounding engineering: ... a backtest that can't cheat by seeing tomorrow's close."
3. **Single dash for emphatic interruption / reversal**
   - `daytrade.mdx:25` — "ran on every signal — no short-circuit — so every rejection got logged"
   - `nfl-predict.mdx:48` — "UIAP-01 — quarantining `api/`"
4. **Numeric range** (en-dash territory, miscoded as em dash)
   - `seatwatch.mdx:34` — "takes 2–5 seconds" (already en dash, OK)
   - `clipify.mdx:35` — "(35-75s)" (hyphen, OK)
   - Verify: no U+2014 used as range — Grep confirms none in MDX.
5. **Structural / decorative label separator** (Astro components)
   - `SectionHeader.astro:25` — `§ {number} — {title}` renders as `§ 01 — WORK`
   - `NextProject.astro:32` — `§ NEXT —`
   - `Header.astro:40` — `aria-label="Jack Cutrara — Home"`
6. **SEO title separator**
   - `BaseLayout.astro:32,59` — `"Jack Cutrara | Software Engineer"` (already uses pipe), but `titleTemplate="%s | Jack Cutrara"` and OG `alt` strings use `-` already — confirm no U+2014 remains here (Grep clean).
7. **Chat-only data (third-person)**
   - `portfolio-context.json:183` and `about-chat.ts:32` — identical "performance — ideally one that will push him" elaboration.

## Replacement rules (priority-ordered)

1. **Aside-between-dashes → commas** when the aside is short and grammatically a noun phrase. Prefer commas over parens to preserve flow.
   - Before: `long-form footage — podcasts, streams, YouTube VODs — and repurpose`
   - After: `long-form footage (podcasts, streams, YouTube VODs) and repurpose` *(parens here because the aside itself contains commas; commas would create three coordinate items)*
2. **Trailing-dash elaboration → period + new sentence** when the elaboration stands alone as a thought. Default move; reads cleanly in Jack's terse voice.
   - Before: `Rate-limit and auth errors stay on the API path — a browser retry would not help.`
   - After: `Rate-limit and auth errors stay on the API path. A browser retry would not help.`
3. **Trailing-dash elaboration → colon** when the second clause defines/specifies the first (no independent verb).
   - Before: `guarantee exit — strictly worse than a clean STANDARD sell in the good case`
   - After: `guarantee exit: strictly worse than a clean STANDARD sell in the good case`
4. **Mid-sentence emphatic interruption → parentheses** when removing the dash would break grammar, and a period would over-fragment.
   - Before: `ran on every signal — no short-circuit — so every rejection got logged`
   - After: `ran on every signal (no short-circuit), so every rejection got logged`
5. **Series-introducing dash → colon**.
   - Before: `three external sources — games via nflreadpy, odds via The Odds API, and weather via Open-Meteo`
   - After: `three external sources: games via nflreadpy, odds via The Odds API, and weather via Open-Meteo`
6. **If any rule produces clunky output, rewrite the sentence.** Jack's voice tolerates short declaratives; do not preserve the dash by force.

## Special cases

- **Section header decorations (`§ 01 — WORK`, `§ NEXT —`):** These are typographic ornaments, not prose. Replace the em dash with a middot `·` (matches `ContactSection.astro` style `&middot;` and project-meta separator), giving `§ 01 · WORK`. Update both `SectionHeader.astro:25` and `NextProject.astro:32`. Re-check `global.css` for any `::before` content that hardcodes the dash.
- **`Header.astro:40` `aria-label="Jack Cutrara — Home"`:** Screen-reader text; use a comma: `"Jack Cutrara, Home"`.
- **SEO meta (`BaseLayout.astro`):** Already uses `|`. No change needed. Confirm by Grep on the file after edits — it currently has zero U+2014 in user-visible strings.
- **Project hero/intro lines:** None in templates — title/tagline render verbatim from frontmatter, which has no em dashes. Safe.
- **`portfolio-context.json` + `about-chat.ts`:** Build artifact + chat third-person source. Per CONTEXT.md table both are in scope. Apply the same rules. Note `about-chat.ts:32` and `portfolio-context.json:183` are the same string; fix once at source, regenerate JSON via `scripts/build-chat-context.mjs` if the build pipeline owns it (otherwise edit both).
- **Code inside MDX (e.g., `` `CLOSED → OPEN → HALF_OPEN` ``):** Those are arrows (U+2192), not em dashes. Do not touch.

## Voice preservation notes

Jack's MDX prose is **dense, declarative, first-person, technical**. Two preservation rules:

- **Do not soften.** Replacing a dash with "which is" or "and this means" flattens the staccato. Prefer a period; trust the reader.
- **Do not over-parenthesize.** Parentheses signal "skippable"; many of these asides are load-bearing technical clarifications. Use parens only for true side info (rule 1 example). For inline qualifiers, prefer comma pairs.
- **Avoid the AI tell of replacing one dash with another.** No semicolons-as-disguised-em-dashes. The reader reads `;` as `—`. Prefer the period.
- **Lists with internal commas** (rule 1) are the one place parens earn their keep.

## Tools the planner should use

- Grep `pattern: "—"` (U+2014) over each in-scope file before editing to enumerate occurrences with line numbers.
- Per-file `Read` (full file when small, ranged when MDX over 25k tokens — none are; all five MDX read clean in one call).
- `Edit` with the full sentence as `old_string` and the rewritten sentence as `new_string` — em dash alone is not unique enough to disambiguate within a file.
- After all edits: re-Grep U+2014 across `src/content/`, `src/data/`, `src/components/`, `src/pages/`, `src/layouts/` — expect zero hits. Also confirm no U+2014 leaked into `src/data/portfolio-context.json` if it is build-generated from another source.
- Astro build (`pnpm build` or equivalent) to confirm no MDX parse breakage from the rewrites.
