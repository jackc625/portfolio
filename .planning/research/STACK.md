# Stack Research — v1.2 Polish

**Domain:** Personal portfolio polish milestone (Astro 6 static site, Cloudflare Workers SSR chat)
**Researched:** 2026-04-15
**Confidence:** HIGH

> **Scope note:** v1.2 is an additive milestone on top of the shipped v1.1 stack. The core stack (Astro 6.0.x, Tailwind v4.2.x, TypeScript 5.9, Node 22, MDX, Cloudflare Pages+Workers, Anthropic SDK, DOMPurify/marked, @astrojs/sitemap, astro-seo, Zod 4) is frozen and not re-researched here. This file only covers **new capabilities**: motion, chat knowledge, analytics, content workflow.

---

## Recommended Stack Additions

### Motion Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Native CSS (`@starting-style`, `transition`, `@keyframes`)** | Baseline 2026 | Enter-animations for primitives, microinteractions on hover/focus, MobileMenu slide-in, chat bubble pop-in | Zero JS, zero dependency, reaches cross-browser baseline in 2026 (Chrome/Firefox/Safari/Edge). `@starting-style` eliminates the classic "animate on mount" JS workaround — the browser animates from a declared starting state the first time an element is styled. Tailwind v4's `@property` + `color-mix()` support pairs cleanly. Already the de-facto motion layer in v1.1 (`transition: color 150ms ease`); v1.2 just adds `@starting-style` blocks. |
| **Native CSS View Transitions (`@view-transition { navigation: auto }`)** | Baseline 2026 (Chrome 126+, Safari 18+, Firefox 141+) | Cross-document page transitions (fade / crossfade / named-element morph) between routes | Uses the browser's MPA View Transition API **without** Astro's `ClientRouter` — two lines of CSS in global.css activates cross-document transitions for same-origin navigations. No SPA router, no hydration, no JS shipped. ~75%+ global support in 2026. Respects `prefers-reduced-motion` automatically. |
| **IntersectionObserver + CSS class toggle** | built-in (all evergreen browsers) | Scroll-reveal on sections (fade+slide-up as content enters viewport) | ~20 lines of inline `<script>` in a tiny utility (`src/scripts/reveal.ts`). Observes elements with `data-reveal`, adds `.is-revealed` class on intersection, CSS handles the actual animation. Zero library, zero cost, fully tree-shakeable into only the pages that need it. |
| **Motion One (`motion` package, vanilla entry)** | 12.38.x | Fallback only — for any single microinteraction that genuinely needs spring physics or sequenced keyframes beyond CSS's reach | 5.1 kB gzipped for `scroll()`; `animate()` + `inView()` tree-shake to ~4–6 kB. Vanilla JS API (not React) works in `.astro` `<script>` blocks. Apache-2.0 licensed. **Only install if a specific primitive fails to land with CSS-only.** Do not install speculatively. |

**Recommendation verdict on GSAP / ClientRouter:**

- **Do NOT reintroduce GSAP.** It was removed in v1.1 for a reason: ~80 kB gzipped, conflicts with editorial restraint, and v1.2 motion needs (enter transitions, scroll-reveal, microinteractions) all land inside CSS baseline features in 2026. Reintroducing GSAP would be a documented regression against the `design-system/MASTER.md` motion contract.
- **Do NOT reintroduce Astro's `<ClientRouter />`.** It was removed in v1.1 when localStorage chat persistence replaced `transition:persist`. Browser-native cross-document view transitions now cover the MPA case without JS. The Astro docs team has [publicly flagged](https://github.com/withastro/docs/issues/10902) that ClientRouter should no longer be presented as a must-have and doesn't align with Astro's "no JS by default" philosophy. The only features ClientRouter offers over native are Firefox fallback, `transition:persist`, directional transitions, and animation functions — none of which v1.2 needs (Firefox 141 ships native cross-doc VT; persist is obsoleted by localStorage; directional/custom animations are overkill for a portfolio).

### Chat Knowledge Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Context stuffing + Anthropic prompt caching** | existing `@anthropic-ai/sdk` ^0.82.0 | Inject all project MDX + About + Resume into the system prompt, cached via `cache_control: { type: "ephemeral" }` | Corpus is ~6 MDX files + about + resume ≈ 8–20 k tokens — well below Haiku 4.5's 200 k window. Prompt caching drops cache-read cost to **0.1× base input price** (~$0.10 per 1M cached tokens at Haiku's $1/1M base). For a personal portfolio at low QPS, this is orders of magnitude simpler than RAG: no vector DB, no embedding pipeline, no retrieval quality tuning, no chunking. Haiku 4.5 requires ≥4,096 tokens for caching to activate — the full corpus easily clears that floor. |
| **Build-time bundler script** | n/a (node script) | Read `src/content/projects/*.mdx` + `src/content/about.md` + `src/pages/resume.astro` at build time → compile into a single `portfolio-knowledge.ts` string exported to the Worker | Same pattern already in use via `portfolio-context.json`. Extend it: the script globs the MDX corpus, strips frontmatter (or preserves as a structured YAML block), concatenates with section headers, and ships as a TS module imported by `src/pages/api/chat.ts`. Regenerates on every build. No runtime cost. |

**Recommendation verdict on RAG:**

- **Do NOT adopt Cloudflare Vectorize / pgvector / LanceDB for v1.2.** The corpus is tiny (~10–20 k tokens), static (updates only on deploy), and QPS is near zero (single-digit chat sessions/day at realistic traffic). Vectorize pricing is cheap ($0.31/month for 10k vectors × 30k queries) but the **complexity cost** — embedding pipeline, chunking strategy, metadata filtering, query-time embedding, retrieval quality tuning — is high for no user-visible win. Industry consensus (Anthropic's own Contextual Retrieval blog, Marktechpost Feb 2026, Konstantinos "Is RAG Still Relevant in 2026") is that **for bounded corpora under 200 k tokens, long-context + prompt caching beats RAG on latency, cost, and answer quality.**
- **Revisit RAG only if:** (a) Jack adds a blog section growing the corpus past ~150 k tokens, (b) per-query latency on Haiku exceeds 3 s consistently, or (c) chat cost exceeds $5/month at steady state. None of these are plausible in v1.2.

### Analytics

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Plausible Analytics (cloud)** | n/a — hosted SaaS | Privacy-first page-view, referral, country, UTM, and goal tracking; recruiter engagement signal | Purpose-built product (not a side feature), 3-year data retention, 100% sample (no sampling), ~1 kB script, cookie-free, GDPR/CCPA/PECR compliant without a cookie banner. Drop-in `<script defer data-domain="jackcutrara.com" src="https://plausible.io/js/script.js">` in `BaseLayout.astro`. Outbound-link click tracking via `script.outbound-links.js` gives direct signal on "did the recruiter click Resume/LinkedIn/GitHub?" — the single most important engagement metric for this site's goal. **Cost: $9/month (10k page views) — cheapest line-item that directly measures the site's success criterion.** |

**Recommendation verdict on alternatives:**

- **Umami Cloud (free hobby tier: 100k events/month, 3 sites, 6-month retention)** is the compelling free alternative. If the $9/mo Plausible bill is unwelcome, Umami Cloud's free tier is more than sufficient for a personal portfolio. Trade-offs: medium API footprint (3–4 calls vs Plausible's 2), 6-month retention cap on free tier, slightly less polished dashboard. **Pick Umami Cloud if cost-sensitive; pick Plausible if treating analytics as a product investment.**
- **Cloudflare Web Analytics (built-in, free)** is insufficient as the *primary* analytics tool: 10% sampled data, 30-day retention, reports capped at 15 entries per dimension, no outbound-link tracking, no goal/event tracking. It's fine as a *secondary* source for Core Web Vitals (which it does better than Plausible) but should not be the recruiter-engagement measurement tool. Can run alongside the primary tool at zero cost.
- **Do NOT self-host Plausible/Umami** for v1.2. Self-hosting an analytics stack (Postgres + ClickHouse + Docker + a separate VPS) for a personal portfolio is a maintenance liability disproportionate to the benefit. Revisit only if traffic grows past free-tier caps.

**Final analytics stack:** Plausible cloud (primary, $9/mo) + Cloudflare Web Analytics (free, secondary for Core Web Vitals). If budget is a hard constraint, substitute Umami Cloud free tier for Plausible.

### Content Workflow

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Plain Node script + `gray-matter`** | gray-matter ^4.0.3 | One-shot/CLI sync of `Projects/<name>/README.md` → `src/content/projects/<slug>.mdx` (or MDX → Projects snapshot) | `gray-matter` parses YAML/TOML frontmatter cleanly, works in Node without AST gymnastics. A ~60-line script in `scripts/sync-projects.mjs` can: glob `Projects/*/README.md`, read existing MDX frontmatter via `getCollection('projects')`, merge, write back. Keep it **idempotent and manual-trigger** (`pnpm sync:projects`) — do not wire to pre-commit hook or dev server to avoid surprise overwrites. |
| **Manual authoring (no tooling)** | n/a | The realistic answer for 4 placeholder MDX files | With only 6 projects total and 4 remaining to write, the sync-tool development cost exceeds the benefit. Author directly in `src/content/projects/*.mdx`, keep `Projects/` folder as loose working notes, and only introduce a sync script if the manual process proves painful. **Start manual; add tooling only if pain is observed.** |

**Recommendation verdict:** Author MDX by hand for v1.2. The content pass is 4 files — a one-time effort, not a recurring workflow. Introducing an AST-based MDX syncer for a four-file translation is speed-bump engineering. If `Projects/` docs become the canonical source later (e.g. Jack starts every project there), revisit with `gray-matter` + a tiny Node script — not Remark/unified/MDX AST tooling, which is overkill.

---

## Installation

```bash
# Motion (only if a specific primitive fails with CSS-only — do not install speculatively)
pnpm add motion

# Analytics — no npm install; Plausible is a <script> tag added to BaseLayout.astro
# Umami Cloud (if chosen instead) — same: <script> tag, no package

# Chat knowledge upgrade — no new deps; reuse @anthropic-ai/sdk with cache_control
# Content sync (only if manual becomes painful)
pnpm add -D gray-matter
```

**Zero-dependency path (preferred):** v1.2 can ship with **no new npm dependencies** — motion layer is CSS+IntersectionObserver, chat is context-stuffing+prompt-caching on existing `@anthropic-ai/sdk`, analytics is a `<script>` tag, content pass is manual MDX authoring. This aligns with the v1.1 restraint ethos.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native CSS + `@starting-style` + IntersectionObserver | **GSAP 3** | Never for v1.2. GSAP was removed in v1.1 as tech-debt; reintroducing it would be a regression against `design-system/MASTER.md`. Bundle cost (~80 kB) is unjustified for the restrained motion v1.2 targets. |
| Native CSS + `@starting-style` + IntersectionObserver | **Motion One (`motion` v12)** | Only if a specific primitive — e.g. spring-physics chat bubble, orchestrated MobileMenu sequence — genuinely cannot be expressed in CSS. Add per-file dynamic import (`await import('motion')`) so only pages that need it pay the 5 kB cost. |
| Native CSS + `@starting-style` + IntersectionObserver | **anime.js v4** | Never recommended for v1.2. Similar bundle size to Motion One, weaker Astro/View Transitions ecosystem, no meaningful advantage for the target feature set. |
| Browser-native cross-document View Transitions (`@view-transition` CSS at-rule) | **Astro `<ClientRouter />`** | Never for v1.2. ClientRouter ships ~10 kB of JS, hijacks navigation, requires lifecycle event handlers for every script, and was deliberately removed in v1.1. Native cross-doc View Transitions cover the MPA case without JS. |
| Context stuffing + prompt caching (Anthropic) | **Cloudflare Vectorize + Workers AI embeddings (RAG)** | If corpus grows past ~150 k tokens (e.g. full blog) OR if steady-state chat cost exceeds $5/month OR if multi-tenant knowledge isolation becomes a requirement. None apply in v1.2. |
| Context stuffing + prompt caching | **pgvector on Postgres / LanceDB / Pinecone** | Same conditions as Vectorize, plus: only if already running a Postgres instance for other reasons. A personal portfolio doesn't. |
| Plausible (cloud, $9/mo) | **Umami Cloud (free hobby tier)** | If the $9/mo cost is unwelcome and 100k events/mo + 6-month retention is acceptable. Umami Cloud is the correct "free-but-real" option. |
| Plausible (cloud) | **Cloudflare Web Analytics (free, built-in)** | As a *secondary* source for Core Web Vitals only — never as primary. Too sampled, too capped, no outbound-link tracking. |
| Plausible (cloud) | **Self-hosted Plausible CE or Umami** | Never for v1.2. Self-hosting analytics = maintaining a second mini-stack. Disproportionate to benefit. |
| Plausible (cloud) | **Fathom Analytics ($15/mo)** | If the Plausible UI proves unsatisfying. Fathom and Plausible are near-equivalent privacy-first products; Plausible is cheaper. |
| Plausible (cloud) | **Google Analytics 4** | Never. Cookie banner required (GDPR/PECR), heavy script, privacy hostile, inconsistent with site ethos. Hard no. |
| Manual MDX authoring | **gray-matter + Node sync script** | Only if the `Projects/` folder becomes the canonical source of truth and content sync becomes recurring pain. |
| Manual MDX authoring | **Remark/unified MDX AST transformers** | Never for v1.2. Overengineered for a 6-project portfolio. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **GSAP (any version, any plugin)** | Removed in v1.1 as tech debt. Reintroducing it would regress the `design-system/MASTER.md` restrained-motion contract and reintroduce ~80 kB gzipped. | Native CSS `@starting-style` + IntersectionObserver + (if strictly necessary) Motion One dynamic import |
| **Astro `<ClientRouter />`** | Removed in v1.1. Ships JS, hijacks navigation, requires script lifecycle handlers (`astro:page-load`, `astro:before-preparation`). Native cross-document View Transitions now cover the use case. | `@view-transition { navigation: auto; }` in `src/styles/global.css` |
| **framer-motion** (React-only package) | Renamed to `motion`. React-only — incompatible with Astro's `.astro` components outside React islands. | `motion` vanilla JS API (only if needed) |
| **Lenis smooth scroll** | Known Astro compatibility issues (GitHub #7758). Overrides native scroll, conflicts with View Transitions, adds unnecessary JS. | Native `scroll-behavior: smooth` + `@view-transition` CSS |
| **Cloudflare Vectorize / any vector DB** for v1.2 | Corpus is 10–20 k tokens; RAG infra cost (chunking, embedding pipeline, retrieval tuning) outweighs any quality win at this scale. Haiku's 200 k window + prompt caching is strictly cheaper and simpler. | Context stuffing all MDX into system prompt with `cache_control: { type: "ephemeral" }` |
| **Self-hosted Plausible / Umami (Docker on VPS)** | Maintaining a Postgres/ClickHouse/Docker analytics stack is disproportionate to benefit for a personal portfolio. | Plausible cloud ($9/mo) or Umami Cloud (free tier) |
| **Cloudflare Web Analytics as the primary analytics tool** | 10% sampled, 30-day retention, 15-row report caps, no outbound-link tracking, no goals. Fine as a secondary CWV source only. | Plausible cloud (primary) + Cloudflare Web Analytics (secondary for Core Web Vitals) |
| **Google Analytics 4** | Requires cookie banner under GDPR/PECR, heavy script, privacy-hostile, incompatible with site's restraint ethos. | Plausible or Umami — both cookie-free, no banner needed |
| **`transition:persist` attribute / Astro's client-side persistence** | Requires `<ClientRouter />`. v1.1 already replaced this pattern with localStorage chat persistence (50-msg cap + 24h TTL). | Continue with localStorage pattern in `src/scripts/chat.ts` |
| **Heavy MDX AST tooling (unified/remark-mdx custom plugins)** for project content sync | Overengineered for 4 placeholder files. | Manual authoring; `gray-matter` only if a recurring sync pain emerges |

---

## Stack Patterns by v1.2 Capability

**Motion layer (primitive microinteractions + page-enter):**
- `@starting-style` blocks in primitive scoped `<style>` (e.g. MobileMenu, WorkRow, chat bubble)
- `@view-transition { navigation: auto }` + `::view-transition-old/new` CSS in `src/styles/global.css` for cross-document transitions
- `src/scripts/reveal.ts` (~20 LOC IntersectionObserver utility) attached via `<script>` tag in sections that opt in with `data-reveal`
- All motion gated on `@media (prefers-reduced-motion: no-preference)` — already convention in v1.1

**Chat knowledge upgrade:**
- New build-time step: `scripts/build-chat-context.mjs` globs `src/content/projects/*.mdx` + about + resume, concatenates with section headers, writes `src/server/chat-knowledge.ts` exporting a single string constant
- `src/pages/api/chat.ts` injects the constant into the Anthropic system prompt with `cache_control: { type: "ephemeral" }` on the knowledge block (not the per-request user message)
- Cache breakpoint after the system-prompt knowledge block, so follow-up messages in a session reuse the cache (0.1× input price)
- Keep existing rate limiting, DOMPurify, marked, SSE streaming intact

**Analytics:**
- `<script defer data-domain="jackcutrara.com" src="https://plausible.io/js/script.outbound-links.js">` added to `BaseLayout.astro` head
- No consent banner needed (cookie-free)
- Event firing for chat-open, chat-message-sent, resume-download, outbound-link via `window.plausible(eventName)` — keep event count under 5 to stay focused
- Cloudflare Web Analytics enabled via Cloudflare dashboard (zero code change, pulls from Pages automatically if opted in)

**Content workflow:**
- Author 4 remaining project MDX files directly in `src/content/projects/`
- Keep `Projects/` folder as working notes, not canonical source
- Do not build sync tooling until the manual pain is observed in practice

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `motion` 12.38.x (only if installed) | Astro 6, native cross-doc View Transitions | Vanilla JS API (`animate`, `scroll`, `inView`) works inside Astro `<script>` blocks. Does NOT require ClientRouter. |
| `gray-matter` 4.0.x (only if installed) | Node 22 LTS | Pure ESM-compatible, no native deps. |
| `@anthropic-ai/sdk` ^0.82.0 (already installed) | Haiku 4.5, prompt caching 2026 | Supports `cache_control` parameter on system/message blocks. Haiku 4.5 cache minimum is 4,096 tokens — portfolio corpus easily exceeds this. Workspace-level cache isolation enforced Feb 5, 2026. |
| Plausible script | All browsers, Astro, Cloudflare Pages | ~1 kB, no npm package needed, no CSP changes beyond allowing `plausible.io` in `script-src`. |
| Native `@view-transition` CSS at-rule | Chrome 126+, Safari 18+, Firefox 141+ | ~75% global support in 2026. Unsupported browsers get instant navigation — graceful degradation, no error. |
| `@starting-style` CSS | Baseline 2026 (Chrome 117+, Safari 17.5+, Firefox 129+) | Cross-browser baseline. No polyfill needed. |

---

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Native CSS + IntersectionObserver for motion (no new deps) | **HIGH** | `@starting-style` and cross-doc View Transitions hit Baseline 2026; v1.1 already runs CSS-only motion successfully; eliminates re-regression of GSAP/ClientRouter. |
| Do NOT reintroduce GSAP or ClientRouter | **HIGH** | Explicit v1.1 removals; Astro docs team publicly deprecated ClientRouter as must-have; native baseline now covers the use case. |
| Context stuffing + prompt caching for chat knowledge | **HIGH** | Corpus size (~10–20 k tokens) is an order of magnitude below Haiku's 200k context. Anthropic's own Contextual Retrieval guidance and 2026 industry consensus favor long-context + caching for bounded corpora. Cache read is 0.1× base price. |
| Plausible cloud as primary analytics | **HIGH** | Purpose-built product, privacy-compliant without cookie banner, outbound-link tracking measures the site's actual success signal (did the recruiter click out to resume/LinkedIn/GitHub?). $9/mo is proportional to the goal. |
| Umami Cloud as free fallback | **HIGH** | 100k events/mo free tier more than sufficient; privacy-first; well-maintained. Acceptable if cost-sensitive. |
| Cloudflare Web Analytics as secondary only | **HIGH** | Official Plausible comparison documents the sampling, retention, and cap limits. Confirmed insufficient as primary. |
| Manual MDX content authoring for v1.2 | **HIGH** | 4-file one-time pass. Tooling cost > benefit. Classic YAGNI. |
| Motion One as optional fallback (not default) | **MEDIUM** | Might not be needed at all. Install only if a specific primitive demands it. 5 kB gzipped if added. |
| Native cross-document View Transitions browser support is acceptable | **MEDIUM** | ~75% global support in 2026; unsupported browsers get instant navigation with no error. Acceptable for a portfolio where the baseline experience is already fast and complete. |

---

## Sources

- [Astro Docs: View Transitions](https://docs.astro.build/en/guides/view-transitions/) — Native cross-document vs ClientRouter tradeoffs (HIGH)
- [withastro/docs #10902: ClientRouter not the only approach](https://github.com/withastro/docs/issues/10902) — Astro team acknowledging ClientRouter is deprecated-in-spirit (HIGH)
- [MDN: @view-transition CSS at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition) — Cross-document view transitions specification (HIGH)
- [MDN: @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) — Entry animation declarative syntax (HIGH)
- [modern.css What's New in CSS 2026](https://modern-css.com/whats-new-in-css-2026/) — `@starting-style` reaches Baseline 2026 across all major browsers (HIGH)
- [Can I Use: View Transitions API](https://caniuse.com/view-transitions) — Cross-document VT support matrix ~75% global in 2026 (HIGH)
- [Chrome Developers: Cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) — Official implementation guide, `@view-transition { navigation: auto }` (HIGH)
- [Motion.dev: scroll docs](https://motion.dev/docs/scroll) — 5.1 kB gzipped, vanilla JS API confirmed (HIGH)
- [npm: motion](https://www.npmjs.com/package/motion) — v12.38.0, 3.6M weekly downloads, tree-shakeable (HIGH)
- [Netlify Developers: Motion + Astro](https://developers.netlify.com/guides/motion-animation-library-with-astro/) — Confirmed Motion v12 works in Astro vanilla `<script>` blocks (MEDIUM)
- [Anthropic: Prompt Caching Docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) — Cache-read at 0.1× base input price, Haiku 4.5 4,096-token minimum, Feb 5, 2026 workspace isolation change (HIGH)
- [Anthropic: Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — Official guidance that context-stuffing + caching beats RAG for sub-200k corpora (HIGH)
- [Marktechpost Feb 2026: RAG vs Context Stuffing](https://www.marktechpost.com/2026/02/24/rag-vs-context-stuffing-why-selective-retrieval-is-more-efficient-and-reliable-than-dumping-all-data-into-the-prompt/) — Comparative analysis; favors RAG at scale but portfolio is below the crossover point (MEDIUM)
- [Konstantinos: Is RAG Still Relevant in 2026?](https://konstantinos.top/blog/37/) — 2026 decision framework for RAG vs long-context (MEDIUM)
- [Cloudflare Vectorize Pricing](https://developers.cloudflare.com/vectorize/platform/pricing/) — $0.31/mo for 10k vectors × 30k queries; confirms price is not the blocker (complexity is) (HIGH)
- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) — $0.011/1k neurons; cheap embeddings, still overkill at portfolio scale (HIGH)
- [Plausible vs Cloudflare Web Analytics](https://plausible.io/vs-cloudflare-web-analytics) — Source-of-truth on CWA's 10% sampling, 30-day retention, 15-row caps (HIGH — from Plausible but empirically verifiable)
- [Plausible: Self-Hosted](https://plausible.io/self-hosted-web-analytics) — Cloud $9/mo, self-host free under AGPL (HIGH)
- [Umami Pricing](https://umami.is/pricing) — Cloud free tier: 100k events/mo, 3 sites, 6-month retention (HIGH)
- [Best Privacy-First Analytics Compared (Nuxt Scripts 2026)](https://scripts.nuxt.com/learn/privacy-first-analytics-compared) — Cross-product comparison including script size, API count, data retention (MEDIUM)
- [Self-Hosted Analytics 2026: Umami vs Plausible (SelfHostWise)](https://selfhostwise.com/posts/self-hosted-website-analytics-in-2026-umami-vs-plausible-complete-guide/) — 2026 self-hosting analysis (MEDIUM)
- [Anthropic API Pricing 2026](https://platform.claude.com/docs/en/about-claude/pricing) — Haiku 4.5: $1/$5 per 1M input/output, 200k context included (HIGH)
- [npm: gray-matter](https://www.npmjs.com/package/gray-matter) — Frontmatter parser, 4.x stable (HIGH)

---

*Stack research for: v1.2 Polish (additive on v1.1 Astro 6 / Tailwind v4 / Cloudflare stack)*
*Researched: 2026-04-15*
