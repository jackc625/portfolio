# Architecture Research — v1.2 Polish

**Domain:** Astro 6 portfolio (subsequent milestone — polish on shipped v1.1)
**Researched:** 2026-04-15
**Confidence:** HIGH (integration surface is fully mapped by reading existing code)

---

## 1. Existing Architecture Snapshot (baseline — DO NOT re-derive)

```
                    Cloudflare Pages (static) + Workers (SSR)
                          jackcutrara.com
┌───────────────────────────────────────────────────────────────────────┐
│  BaseLayout.astro (head, SEO, Fonts API, SkipToContent)               │
│    ├── Header.astro + MobileMenu.astro    [primitives/]               │
│    ├── <main><slot/></main>                                           │
│    ├── Footer.astro                                                   │
│    └── ChatWidget.astro  ◄── <script>import "../../scripts/chat.ts"   │
└───────────────┬──────────────────────────────────────┬────────────────┘
                │ pages import primitives              │ chat.ts (client)
                ▼                                      ▼ POST /api/chat
   src/pages/*.astro   src/pages/projects/[id].astro   src/pages/api/chat.ts
     (index, about,       ↑                              (prerender=false
      projects,           ↑                               SSE stream,
      contact, 404)       ↑                               Haiku 4.5,
                          └──── src/content/projects/*.mdx (Zod schema)
                                (6 MDX, loaded via glob loader)

                          src/data/portfolio-context.json ──► system-prompt.ts
                                (static JSON, stuffed into every request)
```

**Primitives library** (`src/components/primitives/`):
Container · Footer · Header · MetaLabel · MobileMenu · SectionHeader · StatusDot · WorkRow
— all scoped `<style>`, consume `var(--*)` tokens, no Tailwind for styling internals.

**Client scripts** (`src/scripts/`): only `chat.ts` today. Pattern is: module-level
initialization guard, `astro:page-load` listener + DOMContentLoaded fallback, dispatches
`CustomEvent("chat:analytics", { detail: { action, label, timestamp }})` on `document`.

**Content flow today:**
- `Projects/*.md` (Jack's hand-written Markdown, 6 files, `1 - SEATWATCH.md` style names,
  ~200–900 lines of narrative per file, NO frontmatter).
- `src/content/projects/*.mdx` (6 files, ~44–56 lines each — thin MDX with full Zod
  frontmatter; 2 are real case studies, 4 still have placeholder prose).
- `src/data/portfolio-context.json` (hand-curated 6-project summary + skills/education).

The two sources drift independently today. v1.2 must reconcile them.

---

## 2. v1.2 Feature Integration — component by component

### 2.1 Motion layer

**Decision: CSS-first (@keyframes + IntersectionObserver), no ClientRouter.**

The motion work must not reintroduce `<ClientRouter />`. v1.1 explicitly removed it as
D-29 in `design-system/MASTER.md §8` (anti-pattern list), and the entire chat
localStorage persistence architecture (`src/scripts/chat.ts:66-107`) is the workaround for
its absence. Re-adding it breaks the chat lifecycle contract (`transition:persist` is
gone; messages would duplicate on replay) and contradicts the locked anti-pattern list.
**Astro View Transitions via ClientRouter is off the table.**

The four candidates (a/b/c/d in the question) resolve as:

| Option | Verdict | Where it belongs |
|---|---|---|
| (a) CSS `@starting-style` + `@keyframes` in global.css layers | **USE for page-enter fades** | New layer in `src/styles/global.css` — target `main`, `header`, `footer` on initial paint only. |
| (b) Reintroduce ClientRouter | **REJECTED** — contradicts §8 anti-patterns, breaks chat persistence model | n/a |
| (c) IntersectionObserver module in `src/scripts/` | **USE for scroll-reveal** | New file `src/scripts/motion.ts`, follow chat.ts's init-guard + astro:page-load pattern. Toggle `data-motion-revealed="true"` on elements with `[data-motion]`. |
| (d) Per-primitive scoped `<style>` microinteractions | **USE for primitive hover/focus polish** | Inside each of WorkRow, MobileMenu, StatusDot, chat bubble — augment existing `<style>` blocks. Cheapest, most local. |

**Lifecycle model (motion.ts):**

```ts
// src/scripts/motion.ts — mirrors chat.ts bootstrap pattern
let motionInitialized = false;
let observer: IntersectionObserver | null = null;

function initMotion(): void {
  if (motionInitialized) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // honor user
  const targets = document.querySelectorAll<HTMLElement>("[data-motion]");
  if (targets.length === 0) return;
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.setAttribute("data-motion-revealed", "true");
        observer?.unobserve(entry.target); // one-shot
      }
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  targets.forEach((el) => observer!.observe(el));
  motionInitialized = true;
}

// Matches chat.ts exactly — page-load fires on navigation;
// DOMContentLoaded is the first-paint fallback.
document.addEventListener("astro:page-load", initMotion);
if (document.readyState !== "loading") initMotion();
else document.addEventListener("DOMContentLoaded", initMotion);
```

**No-JS fallback:** `[data-motion]` starts at `opacity: 1` in CSS. The observer only sets
`data-motion-revealed` for users who get JS; the reveal state is additive, never blocking.
For users WITH JS and without reduce-motion, CSS inverts the initial: `[data-motion]:not([data-motion-revealed])`
starts hidden, and the attribute toggle reveals. This avoids FOUC on first paint — the
module-level guard runs synchronously on DOMContentLoaded, before any layout shift.

**Layout-thrash avoidance:** only animate `opacity` and `transform: translateY()` —
never `height`, `top`, or `margin`. All reveals under 400ms. Follow MASTER.md §6.2's
"sub-200ms state changes pose no vestibular risk" rule for hover microinteractions;
scroll reveals can go to 400ms because they are one-shot on enter.

**`prefers-reduced-motion` is the first check** in `initMotion()` — if reduced, the
observer never attaches and `[data-motion]` stays at its `opacity:1` default. CSS also
includes the safety net:

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion], [data-motion-revealed] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
}
```

**Page-enter fade** (not scroll-reveal — the initial paint transition for `<main>`):
Pure CSS `@starting-style` on `main` with a `0.3s` opacity + 8px translateY. No JS.
85%+ browser support in 2026 — older browsers get instant render, which is the correct
degradation.

**Microinteractions on primitives** live inside each component's scoped `<style>` — no
global sprawl. Examples: WorkRow arrow currently at 120ms (§5.5, required) — add
`translateX(2px)` on the arrow during hover. Chat bubble `startPulse` is a no-op today
(chat.ts:433) — replace with a CSS `@keyframes` class toggled by chat.ts rather than
reintroducing JS animation.

---

### 2.2 Chat knowledge upgrade

**Decision: context-stuffing via build-time codegen, NOT RAG, NOT tool-calling.**

Reasoning:

| Approach | Pros | Cons | Fit |
|---|---|---|---|
| **Build-time codegen** (merge MDX frontmatter + prose into `portfolio-context.json`) | Zero runtime cost, zero new infra, no Worker cold-start penalty, single deploy artifact, Haiku 4.5's 200K context window trivially accommodates 6 case studies (~3–5K tokens total) | Every request pays the full context token cost | **PICK** |
| **RAG with Cloudflare Vectorize** | Scales to 100s of docs, smaller per-request token cost at scale | 6 projects → 50K+ tokens total, nowhere near Vectorize's sweet spot. Adds embedding pipeline, vector index management, retrieval latency (~100–300ms pre-first-token), and cost. Over-engineered for a 6-project portfolio. | **REJECT** |
| **Tool-calling** (`getProject(id)`, `listProjects()`) | Model fetches on demand | Breaks current SSE streaming contract — Anthropic tool_use events require multi-turn loop (tool_use → client call → tool_result → continue). The `controller.enqueue(text_delta)` loop in `src/pages/api/chat.ts:92-103` would need to handle `tool_use` / `input_json_delta` events, execute a lookup, create a second `messages.create` call, and stream THAT. Triples complexity. | **REJECT** |

**Concrete implementation:**

1. **New build script** `scripts/build-chat-context.mjs` runs before `astro build`:
   - Read `src/content/projects/*.mdx` via `gray-matter` (or Astro's own content API
     via a dev-time query, but gray-matter is simpler here and has zero production cost).
   - For each file, extract frontmatter + strip markdown → produce
     `{ name, tagline, description, techStack, problem, approach, techDetail, challenges,
        year, status, featured, githubUrl, demoUrl, page }`.
   - Merge with hand-curated `src/data/portfolio-context.static.json` (rename — the
     human-authored skills/education/contact fields stay static).
   - Emit `src/data/portfolio-context.json` (generated, gitignored).

2. **Update `package.json` build chain**:
   `"build": "wrangler types && node scripts/build-chat-context.mjs && astro check && astro build && node scripts/pages-compat.mjs"`.

3. **Worker bundle impact**: `portfolio-context.json` is imported at module scope by
   `src/pages/api/chat.ts:6`. Bundling 6 fully-written case studies adds ~30–50KB to
   the Worker bundle (plain UTF-8, no base64). Cloudflare Workers paid tier = 10MB
   zipped, free tier = 3MB zipped — this is a rounding error.

4. **Cold-start latency**: zero. The JSON is already in the bundle; V8 parses it once
   on isolate init (sub-millisecond for ~50KB). No network calls, no KV reads.

5. **Tune `max_tokens`** from 512 → 768 now that responses can reference deeper detail.
   Keep `claude-haiku-4-5` (cheapest capable model; 200K context is overkill-but-fine).

6. **System prompt refinement** (`src/prompts/system-prompt.ts`): currently dumps the
   entire JSON as `<knowledge>`. That still works at 6 projects × ~3KB each. Add a
   `<project-deep-dive>` section that lists available detailed project docs by slug,
   and instruct the model to quote from `approach`/`techDetail` when depth is warranted.

7. **Prompt persona tuning** is a copy change in the same file — no architecture impact.

**If the portfolio ever grows to 20+ projects or adds a blog**: revisit RAG with
Cloudflare Vectorize (`@cf/baai/bge-base-en-v1.5` embeddings, `VECTORIZE` binding).
That is a v1.3+ concern, not v1.2.

**SSE streaming loop changes:** none. The `messages.create({...stream: true})` call
stays identical. The only diff is that `portfolioContext` now contains more text.

---

### 2.3 Analytics

**Decision: Cloudflare Web Analytics (pageviews) + Plausible (custom events), no consent banner.**

Reasoning:

| Option | Privacy | Setup | Fit |
|---|---|---|---|
| Cloudflare Web Analytics | No cookies, no PII, free, zero config (already on CF Pages), GDPR-clean → **no consent banner required** | One `<script>` tag in BaseLayout.astro | **PICK — primary pageviews** |
| Plausible Cloud | No cookies, EU-hosted, $9/mo (or free tier for custom events in some configurations) | One script | **PICK — custom events bridge from chat.ts** |
| Plausible Self-Hosted / Umami | Free if self-hosted | Requires DB + hosting | Overkill for a portfolio |
| Google Analytics 4 | Cookies, consent banner needed, ugly dashboard | | **REJECT** — consent/DNT complexity, slower pageloads, wrong product for this audience |

Cloudflare Web Analytics handles pageviews for free with the infra already in place.
Plausible (or an equivalent) handles the richer custom-event layer that chat.ts emits.

**Script tag placement** (`src/layouts/BaseLayout.astro`):
Add both beacons just before `</body>` (after `<ChatWidget />`). Both `<script defer>`
so neither blocks first paint. Combined size ~4KB.

**DNT / consent:** Cloudflare Web Analytics is documented as GDPR/CCPA-compliant
without consent because it collects no PII and sets no cookies. **No consent banner
needed for v1.2.** Optional courtesy — respect `navigator.doNotTrack`:

```astro
{!Astro.request.headers.get("DNT") && (
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" ...></script>
)}
```

3 lines, optional.

**Custom event bridge** — the rich signal (did the recruiter actually talk to the bot?):

`src/scripts/chat.ts:369-378` already fires `document.dispatchEvent(new CustomEvent("chat:analytics", { detail: { action, label, timestamp } }))` for `chat_open`, `message_sent`, `chip_click`, `chat_error`. This was built in Phase 7 D-36 explicitly to be consumer-agnostic.

**New file** `src/scripts/analytics.ts`:

```ts
// src/scripts/analytics.ts — forwards chat:analytics to Plausible
document.addEventListener("chat:analytics", (e: Event) => {
  const detail = (e as CustomEvent).detail as { action: string; label?: string };
  window.plausible?.(detail.action, { props: { label: detail.label ?? "" } });
});
```

Injected via `<script>import "../../scripts/analytics.ts";</script>` inside BaseLayout.

**Critical: D-36 contract (no conversation content in events)** is preserved — chat.ts
already omits user message bodies from the CustomEvent detail. `analytics.ts` must
never add any. One-line tripwire in a test: assert that dispatched events for
`message_sent` have no `content` field.

---

### 2.4 Content sync

**Decision: `Projects/` is checked into the repo (it already is) as human-authored source of truth; new sync script generates MDX body.**

`Projects/` exists at repo root right now with 6 files matching the 6 MDX files — but
the two are not currently kept in sync. Jack writes long-form narrative in
`Projects/N - NAME.md` (plain markdown, no frontmatter), and someone (or
Claude-via-GSD) has to translate that into MDX with frontmatter. This drift is the root
cause of 4 of 6 MDX files still having placeholder prose.

**v1.2 solution — a one-way sync script** `scripts/sync-projects.mjs`:

1. Read all `Projects/*.md` files.
2. For each file, the script expects a corresponding MDX in `src/content/projects/`
   whose basename matches a slug derived from the Projects filename (e.g.
   `1 - SEATWATCH.md` → `seatwatch.mdx`; maintain a small explicit map in the script
   for names that don't transliterate cleanly, e.g., `6 - DAYTRADE.md` →
   `crypto-breakout-trader.mdx`).
3. The sync script **does not touch frontmatter** — frontmatter is authored manually in
   the MDX because it encodes editorial decisions (order, featured, tagline) that don't
   belong in the prose source. The script only replaces the body section (everything
   after the second `---` line).
4. Zod enforcement happens automatically during `astro check` — if a sync corrupts
   required frontmatter fields, the build fails.
5. Add `"sync:projects": "node scripts/sync-projects.mjs"` to `package.json`. Run
   manually — **not wired into `build`** because production builds should never need
   to sync (the repo is the source of truth, the sync is authoring-time only).

**Why not external / submodule / symlink:**

- Submodule would split the repo across two GitHub projects for no benefit.
- Symlink breaks on Windows dev setup (Jack's env) and on Cloudflare Pages build env.
- External CMS (Sanity, Notion) is explicitly Out of Scope per `.planning/PROJECT.md`.

**Why not manual copy (the status quo):**

- Manual copy is exactly what caused the 4-of-6-placeholder drift in the first place.
- A script that reads Projects/ and writes to src/content/projects/ with git diff
  visible makes the translation auditable.

**Schema contract** (enforced today, unchanged in v1.2):
`src/content.config.ts` already uses `glob({ pattern: "**/*.mdx", base: "./src/content/projects" })` and a Zod schema requiring title, tagline, description, techStack, featured, status, category, order, year. The sync script writes body-only, leaving frontmatter as the human contract surface. `astro check` catches schema violations before build.

---

### 2.5 Tech debt — full mapping of all 7 items

From `.planning/milestones/v1.1-MILESTONE-AUDIT.md` `tech_debt` block:

| # | Item | File(s) | Fix shape |
|---|---|---|---|
| 1 | 4 lightning-css `Unexpected token Delim('*')` warnings | `.planning/phases/09-primitives/deferred-items.md` (tracking). Root cause is literal `var(--token-*)` strings in `.planning/` files picked up by Tailwind v4 Oxide. Already partially fixed in `src/styles/global.css:37-39` via `@source not "../../.planning/**"`. | Verify the `@source not` globs actually cover all files; audit `.planning/`/`design-system/` for any remaining `var(--token-*)` example strings; if any survive, quote them in backticks to avoid Oxide's detector, or extend the `@source not` list. |
| 2 | WR-01: MobileMenu focus trap — middle elements behind backdrop remain in tab order | `src/components/primitives/MobileMenu.astro` (focus-trap script block) | When menu opens, set `inert` attribute (or `aria-hidden="true" + tabindex="-1"`) on all siblings except the menu itself. Remove on close. ~10-line diff. |
| 3 | WR-03: OG image URL builder corrupts absolute URLs | `src/layouts/BaseLayout.astro:38-40` | **Already fixed** — `resolveOg()` function with `/^https?:\/\//i` guard. Verify with a test: pass `ogImage="https://cdn.example.com/img.png"` and confirm passthrough. Close the debt item. |
| 4 | WR-04: `/dev/primitives.astro previewYears[i]` can produce `undefined` | (none — route deleted Phase 11) | **Already resolved** — close the debt item. |
| 5 | IN-06: `#666` hex in print stylesheet outside 6-token palette | `src/styles/global.css:174` (approximately — print-only @media block) | Either replace with `var(--ink-muted)` (closest token at `#52525B`) or add a print-only exception note to MASTER.md §2.3 Lock contract. Recommend: replace with token. One-line CSS diff. |
| 6 | Live vs replayed chat copy button mismatch (SVG icon vs "COPY" text) | `src/scripts/chat.ts:302` (live, SVG) vs `src/scripts/chat.ts:555` (replay, text) | Pick one and standardize. The replay version (text label) is more accessible and uses the already-defined `.label-mono` class. Port the text-label + hover-reveal pattern to the `createBotMessageEl` function so live and replay are identical. ~15-line diff. |
| 7 | `--ink-faint` (2.5:1) fails WCAG AA contrast on decorative metadata | `src/styles/global.css:12` (token definition) + `design-system/MASTER.md §2.1` | Intentionally accepted per MASTER.md. Two options: (a) **do nothing** — this is a documented design trade-off, Lighthouse a11y = 95 is acceptable; (b) darken `--ink-faint` from `#A1A1AA` to `#71717A` (Zinc 500 → Zinc 600) which lifts contrast to ~4.6:1 and restores Lighthouse 100. Option (b) is a **design decision** and must route through the frontend-design skill per PROJECT.md's constraints. Flag it — do not fix unilaterally. |

All 7 map to existing files. None require new architecture. The bulk of the fixes are
scoped to `src/scripts/chat.ts`, `src/components/primitives/MobileMenu.astro`, and
`src/styles/global.css`.

---

## 3. Recommended directory tree (new vs modified)

Legend: **+** = new in v1.2 · **~** = modified in v1.2 · unmarked = unchanged

```
portfolio/
├── Projects/                                    # source-of-truth narrative markdown
│   ~ 1 - SEATWATCH.md   (already real — unchanged)
│   ~ 2 - NFL_PREDICT.md  (content pass if narrative changed)
│   ~ 3 - SOLSNIPER.md
│   ~ 4 - OPTIMIZE_AI.md
│   ~ 5 - CLIPIFY.md
│   ~ 6 - DAYTRADE.md
│
├── scripts/
│   + sync-projects.mjs                          # Projects/*.md → src/content/projects/*.mdx body sync
│   + build-chat-context.mjs                     # MDX → portfolio-context.json (build step)
│     pages-compat.mjs                           # existing — untouched
│
├── src/
│   ├── content/projects/
│   │   ~ clipify.mdx                            # content pass (4 of 6 were placeholder)
│   │   ~ crypto-breakout-trader.mdx
│   │   ~ nfl-predict.mdx
│   │   ~ optimize-ai.mdx
│   │     seatwatch.mdx                          # already real — unchanged
│   │     solsniper.mdx                          # already real — unchanged
│   │
│   ├── data/
│   │   + portfolio-context.static.json          # hand-authored (skills, education, contact, personal) — split from current
│   │   ~ portfolio-context.json                 # GENERATED by build-chat-context.mjs — gitignored
│   │
│   ├── scripts/
│   │     chat.ts                                # ~ tech debt #6 (copy button normalization); already emits chat:analytics
│   │   + motion.ts                              # IntersectionObserver scroll-reveal
│   │   + analytics.ts                           # listens to chat:analytics, forwards to Plausible
│   │
│   ├── components/
│   │   ├── primitives/
│   │   │   ~ MobileMenu.astro                   # tech debt #2 (inert siblings); polish hover
│   │   │   ~ WorkRow.astro                      # microinteraction: arrow translateX on hover
│   │   │   ~ StatusDot.astro                    # microinteraction: subtle pulse via CSS @keyframes
│   │   │   ~ Footer.astro                       # data-motion attribute for scroll-reveal entry
│   │   │   ~ SectionHeader.astro                # data-motion attribute
│   │   │     Header.astro, Container.astro, MetaLabel.astro    # unchanged
│   │   │
│   │   └── chat/
│   │       ~ ChatWidget.astro                   # optional: CSS @keyframes bubble pulse (replace no-op JS stub)
│   │
│   ├── layouts/
│   │   ~ BaseLayout.astro                       # add CF Web Analytics + Plausible beacons; inject analytics.ts/motion.ts scripts; close OG URL tech debt #3 (already landed)
│   │
│   ├── prompts/
│   │   ~ system-prompt.ts                       # refine persona + add <project-deep-dive> section referencing enriched context
│   │
│   ├── pages/api/
│   │     chat.ts                                # unchanged structure; max_tokens 512 → 768 is the only diff
│   │
│   └── styles/
│       ~ global.css                             # tech debt #5 (#666 → token); tech debt #7 (conditional: darken --ink-faint if design-approved); new motion layer with [data-motion], @starting-style main, @keyframes pulse for StatusDot/chat-bubble; reduced-motion safety net
│
├── design-system/
│     MASTER.md                                  # locked — v1.2 does not amend (motion layers ON TOP intentionally per PROJECT.md)
│
├── .planning/
│   + milestones/v1.2-MILESTONE-AUDIT.md         # (created at milestone close)
│   + research/{SUMMARY,STACK,FEATURES,ARCHITECTURE,PITFALLS}.md   # this file + siblings
│
├── package.json                                 # ~ add sync:projects script; update build to call build-chat-context.mjs; add gray-matter dep
└── astro.config.mjs                             # unchanged
```

**Net new code surface:** 2 build scripts (~150 LOC), 2 client scripts (~80 LOC),
~10 line modifications across 6 Astro components, ~60 lines of new CSS in global.css.
Under ~300 LOC of net code for the entire milestone.

---

## 4. Suggested phase build order

Ordering is driven by three constraints:
- Content unblocks chat (real MDX → better stuffed context).
- Tech debt in motion-adjacent files must land before motion layers on top.
- Analytics must ship early enough to collect data from the polish work itself.

**Phase order (5 phases):**

1. **Phase 12 — Tech Debt Sweep** (ships first; unblocks everything)
   - All 7 audit items (#3, #4 already resolved — close them; #1, #2, #5, #6 are fixes; #7 routed to design-skill for go/no-go).
   - Outcome: clean baseline with zero known debt. Files touched: WorkRow, MobileMenu, BaseLayout, chat.ts, global.css.
   - **Why first:** every subsequent phase touches these files. Doing debt after motion means re-testing motion after debt fixes.

2. **Phase 13 — Content Pass + Sync Infrastructure** (ships second; unblocks chat)
   - Write real case studies in `Projects/` for the 4 placeholder projects.
   - Build `scripts/sync-projects.mjs`.
   - Run sync, verify Zod schema passes, commit regenerated MDX.
   - Audit About page narrative, Homepage lead copy, Resume link.
   - Outcome: 6/6 real case studies live, `Projects/ → src/content/projects/` pipeline documented and automated.
   - **Why second:** chat upgrade in Phase 14 reads the content generated here. Doing chat first means re-stuffing context a phase later.

3. **Phase 14 — Chat Knowledge Upgrade** (depends on Phase 13)
   - Build `scripts/build-chat-context.mjs` to merge MDX into `portfolio-context.json`.
   - Split `portfolio-context.static.json` from the generated one.
   - Wire build step, gitignore the generated JSON.
   - Tune system prompt persona + add `<project-deep-dive>` references.
   - Bump `max_tokens` 512 → 768.
   - Manual QA: 20+ conversation turns across recruiter/engineer personas.
   - Outcome: chat references actual project detail, not placeholder summaries.
   - **Why third:** must come after Phase 13 or the build step embeds placeholder prose.

4. **Phase 15 — Analytics Instrumentation** (independent; can run parallel with 13/14 but cheaper after them)
   - Add CF Web Analytics beacon + Plausible script to BaseLayout.
   - Build `src/scripts/analytics.ts` to bridge `chat:analytics` events to Plausible custom events.
   - Verify DNT handling decision (ship without banner per CF's GDPR posture).
   - Set up Plausible + CF Web Analytics dashboards, document them in PROJECT.md.
   - Outcome: measurable recruiter engagement signal from day one of the polish motion layer.
   - **Why fourth:** shipping motion without analytics means you can't see whether it helped. Shipping analytics before content means initial traffic data is measuring placeholder-site.

5. **Phase 16 — Motion Layer** (ships last; layers on stable content/components)
   - New `src/scripts/motion.ts` IntersectionObserver module.
   - New motion CSS layer in `global.css` (`@starting-style` page-enter, `[data-motion]` scroll-reveal, `@keyframes` StatusDot pulse, chat bubble pulse).
   - Per-primitive microinteraction polish (WorkRow arrow slide, MobileMenu, Footer icon hover, chat bubble).
   - Verify `prefers-reduced-motion` on all additions — both the JS guard and the CSS safety net.
   - Re-run Lighthouse — must stay ≥90 Performance.
   - Outcome: tasteful motion on top of stable, well-measured, fully-content-complete site.
   - **Why last:** MASTER.md §6 explicitly says "editorial system is mostly motionless" and motion layers ON TOP intentionally — this phase cannot be justified until the motionless system is actually stable and the content underneath is real (jittering placeholder content is worse than static placeholder content).

**Phases 13 and 14 can be merged** into a single "Content + Chat" phase if milestone
scope pressure demands — they share files and reviewer context. Phases 12, 15, 16 should
stay separate.

---

## 5. Integration risks & call-outs

**High-confidence risks:**

- **Motion + chat widget lifecycle:** `src/scripts/chat.ts` uses `astro:page-load`.
  `src/scripts/motion.ts` will use the same event. Both modules have independent init
  guards, so no contention — but BOTH must handle the case where Astro View Transitions
  is NOT active (no ClientRouter), so `astro:page-load` fires ONCE per page load. This
  matches existing chat.ts behavior. **No new risk.**

- **Build-step ordering**: `scripts/build-chat-context.mjs` MUST run before `astro build`
  so the generated JSON exists for the Worker bundle. Current package.json build order
  is `wrangler types → astro check → astro build → pages-compat.mjs`. Insert the
  context build **before** `astro check` so schema errors surface early:
  `wrangler types → build-chat-context.mjs → astro check → astro build → pages-compat.mjs`.

- **Analytics + chat CustomEvent contract (D-36)**: Phase 7 D-36 documented that
  `chat:analytics` events contain NO conversation content. `src/scripts/analytics.ts`
  must preserve that — never forward `message_sent` with message body. Audit: current
  chat.ts dispatches `trackChatEvent("message_sent")` with no second arg, and only
  `chip_click` forwards the chip label (which is static UI text, not user input).
  Safe as-is. Just don't add a conversation-content forwarder in `analytics.ts`.

**Lower-confidence risks:**

- **Plausible + CF Web Analytics double-count pageviews**: both will record. That's
  fine for v1.2 — CF is ground truth, Plausible is for custom events. If the double-count
  is cosmetically bothersome, swap Plausible's script to `script.manual.js` to disable
  auto-pageviews and call `plausible()` only for custom events.

- **`inert` attribute browser support**: supported in all evergreen browsers since 2023.
  Safari 15.4+, Firefox 112+, Chrome 102+. For MobileMenu focus trap (tech debt #2),
  `inert` is cleaner than `aria-hidden + tabindex="-1"`. If Jack needs Safari <15.4 for
  recruiters on older MacBooks, fall back to the two-attribute pattern. **LOW risk** —
  2026 browser share makes this moot.

- **`@starting-style` browser support**: ~85% in early 2026. Older browsers skip the
  entry animation and render instantly — correct degradation, no JS polyfill needed.

---

## 6. Sources

- `src/layouts/BaseLayout.astro` (read) — OG URL builder already fixed at lines 38-40 via `resolveOg()`.
- `src/pages/api/chat.ts` (read) — SSE stream structure, `portfolio-context.json` import, Haiku 4.5 model, `max_tokens: 512`.
- `src/scripts/chat.ts` (read) — module-level init guard pattern, `chat:analytics` CustomEvent contract, localStorage persistence at lines 66-107, live-vs-replay copy button divergence at lines 302 and 555.
- `design-system/MASTER.md §6 Motion, §8 Anti-patterns` (read) — the pragmatic motion line; ClientRouter and view transitions are anti-patterns; GSAP is uninstalled permanently; MobileMenu has no entrance animation.
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md` (read) — all 7 tech debt items with exact file:line references.
- `src/content.config.ts` (read) — Zod schema contract for project MDX frontmatter.
- `astro.config.mjs` + `wrangler.jsonc` (read) — CF Pages + CF Workers rate-limit binding, Cloudflare adapter, Fonts API config.
- `package.json` (read) — build chain, no gray-matter yet (must add for build-chat-context.mjs), Anthropic SDK 0.82, Astro 6.0.8.
- [Cloudflare Web Analytics docs](https://developers.cloudflare.com/web-analytics/) (HIGH confidence, existing platform) — cookieless, no consent banner required.
- [MDN `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (HIGH) — ~85% browser support in 2026; instant-render fallback for older browsers.
- [Anthropic tool-use streaming](https://docs.anthropic.com/claude/docs/tool-use#streaming-with-tool-use) (MEDIUM) — confirms tool_use events break single-pass SSE streaming, supporting the reject decision.
- [Cloudflare Workers size limits](https://developers.cloudflare.com/workers/platform/limits/#worker-size) (HIGH) — 3MB free / 10MB paid zipped; 50KB JSON import is negligible.
