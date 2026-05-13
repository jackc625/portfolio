---
quick_id: 260513-g96
type: inventory
---

# INVENTORY — In-scope em-dash occurrences

## Summary

| Bucket | Files | Em dashes |
|---|---|---|
| MDX body prose | 6 | 64 |
| Component rendered text | 4 | 4 |
| **Total in-scope** | **10** | **68** |

| Bucket | Files | Em dashes | Why OUT |
|---|---|---|---|
| MDX `chatSummary` frontmatter | 5 of 6 | 7 | Chat-only (not rendered by `[id].astro`) |
| Chat data (`portfolio-context.*`, `about-chat.ts`) | 3 | 14 | Chat-only per `about-chat.ts` docstring |
| Email templates (`src/lib/email/*`) | 2 | 85 | Sent to Jack, not site |
| Chat prompts (`src/prompts/*`) | 2 | ~11 | Instructions to Claude |
| Worker / lib / scripts / validation | 16 | ~292 | All comments + log strings |
| BaseLayout, `[id].astro` page | 2 | 8 | All in JSX/JS comments |

## In-scope occurrences

### `src/content/projects/clipify.mdx` (12 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 27 | `long-form footage — podcasts, streams, YouTube VODs — and repurpose` | aside-pair (contains commas) | Wrap aside in parens |
| 31 | `connected them — \`q_transcribe\`...\`q_render\` — with per-job timeouts` | aside-pair (contains code) | Parens or restructure |
| 33 | `global time — memory stayed bounded` | trailing elaboration | Period + new sentence |
| 35 | `across the transcript — energy peaks...speaker-change dynamics — to generate` | aside-pair (long list) | Parens |
| 37 | `Stripe drove three billing plans — Free (60 min/month, watermarked), Pro ($29/mo, 600 min), Agency ($99/mo, 2000 min) — with five webhook` | aside-pair (list with internal punctuation) | Parens |
| 41 | `deliberate anti-abuse choice — it prevents users` | trailing elaboration | Colon |
| 49 | `first-pass filter — the tempting shape` | trailing elaboration | Period + new sentence |

### `src/content/projects/daytrade.mdx` (14 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 17 | `chased a strategy — "I found the magic indicator combination" — and ignored` | aside-pair (quote) | Parens |
| 21 | `interfaces.py\` — \`BaseStrategy\`...\`BaseFilter\` — so the orchestrator` | aside-pair (code list) | Parens |
| 21 | `dispatches through \`BreakoutStrategy\` → \`FilterChain\` → \`PositionSizer\` → \`PaperBroker\`` | NOT em dash — these are U+2192 arrows; SKIP |
| 23 | `live and backtest paths breaks a test` (trailing in same paragraph) | trailing | Period |
| 23 | `same function body runs in the backtest via \`check_signal_on_df\` — shared indicator math, shared entry logic — so any drift` | aside-pair | Parens or commas |
| 25 | `ran on every signal — no short-circuit — so every rejection` | aside-pair (short) | Parens |
| 27 | `equity - allocated_capital)\` — this closed a real over-allocation bug` | trailing elaboration | Period + new sentence |
| 29 | `\`os.replace\` — atomic on POSIX and Windows — so` | aside-pair | Parens |
| 33 | `Conservative fills — assuming the stop filled first when both stop and take-profit were touched in the same candle — systematically underestimated` | aside-pair (long) | Parens |
| 41 | `hard-coded safety floors are worth their maintenance cost — security-through-configuration only works` | trailing elaboration | Period + new sentence |

### `src/content/projects/nfl-predict.mdx` (13 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 26 | `the standard tutorial shape — scrape some play-by-play, train on a random train/test split, report a number — teaches the scikit-learn API` | aside-pair (list w/ commas) | Parens |
| 30 | `one bad row fails the whole batch — silent row-skipping causes downstream corruption` | trailing elaboration | Period or colon |
| 30 | `three external sources — games via \`nflreadpy\`, odds via The Odds API, and weather via Open-Meteo` | series-introducing | Colon |
| 32 | `chronological Elo ordering check — violations raise \`LeakageViolation\`` | trailing | Period |
| 34 | `the mathematically correct space — log-odds for probabilities, point space for spreads and totals — with weights` | aside-pair | Parens |
| 40 | `Market blending caps upside — I cannot beat a sharp book by much — but the alternative` | aside-pair | Parens |
| 44 | `The test suite is 70 files — 45 unit, 16 integration, 9 API — including` | aside-pair (numeric list) | Parens |
| 48 | `UIAP-01 — quarantining \`api/\`` | trailing elaboration | Colon |

### `src/content/projects/optimize-ai.mdx` (8 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 18 | `Personal fitness data is sensitive — body weight, body composition, and training history` | trailing elaboration (series) | Colon |
| 22 | `Supabase providing Postgres, auth, and storage — zero custom API routes` | trailing elaboration | Period or colon |
| 26 | `Each hook — \`useHabits\`, \`useWeightLogs\`, \`useWorkouts\`, \`useMacros\`, \`useUser\` — encapsulates` | aside-pair (list) | Parens |
| 34 | `every table change requires an RLS policy migration, not just a code change — a disciplined constraint` | trailing | Period + new sentence |
| 42 | `timezone correctness is not a storage detail to paper over with formatters — it is a schema decision` | trailing | Period + new sentence |

### `src/content/projects/seatwatch.mdx` (10 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 28 | `was not just speed — it was reliability at scale` | trailing | Period + new sentence |
| 32 | `four independently deployed services on Railway — a React 19 SPA, an Express REST API...content site — plus a shared \`packages/shared\`` | aside-pair (long list) | Parens |
| 34 | `that takes 2–5 seconds but tolerates UI-layer challenges the API rejects. Rate-limit and auth errors stay on the API path — a browser retry would not help` | trailing | Period + new sentence (the `2–5` is en-dash U+2013, ignore) |
| 36 | `26-profile browser identity pool — each user is assigned a deterministic identity` | trailing | Period or colon |
| 36 | `transactional plan enforcement — the active-request count check runs` | trailing | Period |
| 40 | `dual-strategy fallback adds 2–5 seconds of latency` (NOT em — en dash U+2013, ignore) |  |  |
| 40 | `Poisson-distributed polling is statistically cheaper to detect than fixed intervals and costs roughly 5× the clock-time variance — I accepted the variance` | trailing | Period |
| 40 | `real users are consistent, not random, so consistency wins` (no dash here)| |  |
| 40 | `A single-worker uvicorn equivalent was rejected early — horizontal scaling was non-negotiable` | trailing | Period or colon |
| 48 | `original worker deleted the new lock on completion — a textbook distributed-systems bug` | trailing | Period |
| 48 | `detection evasion is fundamentally about consistency, not randomness — a real user has a stable browser fingerprint` | trailing | Period |

### `src/content/projects/solsniper.mdx` (7 dashes in body)

| Line | Snippet | Type | Suggested approach |
|---|---|---|---|
| 18 | `in the first block or two after detection — manual trading at that speed is not viable` | trailing | Period |
| 26 | `Tier 2 scoring runs through \`Promise.allSettled\` — RugCheck risk score, top-holder concentration...and Metaplex \`isMutable\` metadata` | trailing series | Colon |
| 28 | `the \`activeMints\` Set check, the \`INSERT\` of a \`BUYING\` row, and \`activeMints.add(mint)\` all execute in one call-stack frame with no \`await\` — no concurrent token event can slip through` | trailing | Period |
| 34 | `slippage to guarantee exit — strictly worse than a clean STANDARD sell in the good case, strictly better than a stuck position in the bad case` | trailing | Colon |
| 42 | `searches both token programs in a single call, and the lesson was that defensive-looking duplicate code paths often hide the real bug` (no em dash here — confirm) |  |  |
| 42 | `\`POST /api/config\` validates shape, then the full \`TradingConfigSchema\`, then a \`validateSemantics()\` cross-field pass, and rolls back via a \`structuredClone\` snapshot on failure` (no em dash here — confirm) |  |  |
| 42 | `\`structuredClone\` was the one-line fix, and the broader lesson was that rollback correctness requires deep isolation, not shallow pointer preservation` (no em dash — confirm) | | |

(Note: rows where "no em dash here" appears are line content for context; the executor must re-grep solsniper.mdx and identify each of the 7 actual U+2014 in body lines 18, 26, 28, 34, 42 before editing.)

### Component rendered text (4 dashes)

| File:Line | Code | Type | Decision |
|---|---|---|---|
| `src/components/NextProject.astro:32` | `<span class="label-mono next-project-label">§ NEXT —</span>` | decorative header | Replace `—` with middot `·` → `§ NEXT ·` |
| `src/components/ContactSection.astro:28` | `<span ...>&sect; 03 &mdash; CONTACT</span>` | decorative header (HTML entity) | Replace `&mdash;` with `&middot;` → `§ 03 · CONTACT` |
| `src/components/primitives/Header.astro:40` | `<a ... aria-label="Jack Cutrara — Home">JACK CUTRARA</a>` | screen-reader text | Replace `—` with comma → `"Jack Cutrara, Home"` |
| `src/components/primitives/SectionHeader.astro:25` | `<span ...>§ {number} — {title}</span>` | decorative header template | Replace `—` with `·` → `§ {number} · {title}` |

## Out-of-scope (audit trail)

Files surveyed and confirmed clean / out-of-scope per CONTEXT.md exclusions:

- `src/data/about.ts` — 0 em dashes (first-person site source, in scope but clean)
- `src/data/contact.ts` — 0 em dashes
- `src/data/about-chat.ts` — 1 em dash (chat-only, EXCLUDED)
- `src/data/portfolio-context.json` — 13 em dashes (chat-only, EXCLUDED)
- `src/data/portfolio-context.static.json` — 0 matches
- `src/layouts/BaseLayout.astro` — 6 em dashes, all in JSX/JS comments (EXCLUDED)
- `src/pages/projects/[id].astro` — 2 em dashes, both in JSX comments (EXCLUDED)
- All `src/components/**/*.astro` other dashes — verified as JSDoc / inline-JS / CSS / HTML comments (EXCLUDED)
- All MDX `chatSummary` frontmatter fields — 7 em dashes total (EXCLUDED)
- All `src/scripts/**`, `src/lib/**`, `src/prompts/**`, `src/pages/api/**`, `src/worker.ts`, `src/types/**`, `src/styles/**` — comments or internal strings (EXCLUDED)

## Verification gates for executor

1. After edits, `Grep '—' src/content/projects/*.mdx` should return only `chatSummary` line(s) per file (line 5).
2. After edits, `Grep '—|&mdash;' src/components/NextProject.astro src/components/ContactSection.astro src/components/primitives/Header.astro src/components/primitives/SectionHeader.astro` should return only JSDoc/comment lines, never template-body lines.
3. Astro build (`pnpm build` or equivalent) must still succeed.
4. Spot-check rendered output: `/projects/clipify`, `/projects/seatwatch`, `/projects/solsniper` — confirm prose reads cleanly.
