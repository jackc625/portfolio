# Feature Research — v1.2 Polish Milestone

**Domain:** Personal portfolio site — polish pass on shipped Astro 6 editorial build
**Researched:** 2026-04-15
**Confidence:** HIGH (motion + case study structure + analytics); MEDIUM (chat knowledge approaches — implementation-dependent); HIGH (anti-features — MASTER.md already forbids most of them)

---

## Scope Reminder

v1.2 is a *polish* milestone on top of a locked editorial design system. The six-hex palette, Geist typography, seven primitive library, restrained-motion stance, and Phase 7 chat architecture are **already shipped**. This research covers only the five new capability areas being layered on top:

1. Tasteful motion layer (page enter/transition, scroll-reveal, primitive microinteractions — **no hero signature moment**)
2. Content pass (4 placeholder MDX files → real case studies, About audit, copy audit, `Projects/` docs)
3. Chat widget knowledge upgrade
4. 7 v1.1 tech debt items (enumerated in `v1.1-MILESTONE-AUDIT.md` — not researched here)
5. Analytics instrumentation for recruiter engagement

Features the site already has (home, about, projects index, case studies, contact, chat widget, JSON-LD, sitemap, OG, Lighthouse 100/95/100/100) are **not re-researched**.

---

## 1. Motion Layer — Feature Landscape

### 1.1 Table Stakes (a polished 2026 portfolio is expected to have these)

Missing any of these and the site feels static/unfinished to a design-literate recruiter. All of these are compatible with MASTER.md §6's "pragmatic motion line" and do not require amending the design system.

| Feature | Why Expected | Complexity | Duration / Easing | Reduced-Motion Behavior |
|---------|--------------|------------|-------------------|-------------------------|
| **Page enter fade** | Hard DOM swap on every navigation feels jarring. Astro 6 View Transitions give near-free polish via the browser's native API. | LOW — two directives (`transition:animate="fade"` on `<main>`, opt-in `<ClientRouter />`). Must reconcile with MASTER §6.1 "no ClientRouter" — amendment required or use CSS-only crossfade. | 200–300ms, `ease-out` | Native API auto-disables under `prefers-reduced-motion: reduce` — instant swap |
| **Scroll-reveal (fade + 8–16px translateY)** | Sections feel inert without progressive reveal. Used across Linear, Vercel, Brian Lovin, Rauno Freiberg. | LOW — IntersectionObserver + `[data-reveal]` CSS class, ~30 lines vanilla TS. No library. | **250–350ms**, `cubic-bezier(0.22, 1, 0.36, 1)` ("ease-out-quint"). Translate amount **12px max**. | `@media (prefers-reduced-motion: reduce)` → elements start at final state (opacity 1, no translate). `once: true` so re-entry doesn't re-trigger. |
| **Hover/focus state transitions** (already on site) | Link color, underline, arrow reveal — instant swap feels broken per MASTER §6.4. | LOW — already spec'd in MASTER §6.2. | **120ms**, `ease` (matches existing WorkRow arrow) | Unaffected — sub-200ms color/opacity is safe per MASTER §6.3. |
| **Focus-visible ring animation** | Accessibility affordance; instant outline snap is fine but a 100ms outline-offset grow is more refined. | LOW — CSS `:focus-visible` + `transition: outline-offset 100ms ease`. | 100ms, `ease` | No change needed — motion is functional state signal. |
| **Copy-to-clipboard confirmation** | Chat code-block copy button already exists — the "copied!" state swap should fade, not flicker. | LOW — CSS opacity transition, 150ms. | 150ms, `ease` | Already a state transition; compliant. |

### 1.2 Differentiators (tasteful primitive microinteractions that set this site apart)

These are small, compound effects that a 2026 recruiter would notice but can't name. Restrained, editorial, compatible with the six-hex palette. Each one is a **feature unit**; the roadmap can ship them independently.

| Feature | Value Proposition | Complexity | Duration / Easing | Notes |
|---------|-------------------|------------|-------------------|-------|
| **WorkRow hover — arrow slide-in** | Existing spec is opacity 0→1 over 120ms. Adding a **4px `translateX(-4px)` → `translateX(0)`** on the arrow turns a fade into directional motion at zero cost. | LOW — modify WorkRow.astro scoped style. | 180ms, `cubic-bezier(0.22, 1, 0.36, 1)` | MASTER §5.5 spec amendment — additive, not conflicting. |
| **WorkRow hover — title letter-spacing tighten** | Title goes from `-0.01em` to `-0.015em` on row hover. Invisible at a glance, feels tactile. Rauno Freiberg-style "invisible detail." | LOW — scoped style, `transition: letter-spacing 200ms ease`. | 200ms, `ease` | Risk: subpixel shifts may cause janky reflow on some browsers. Test in Safari. |
| **Section enter — word/line stagger on headings** | `.h1-section` titles split to spans, each staggered 40ms. Feels editorial. Used by Vercel, Linear. | MEDIUM — split on space in template (not runtime JS), IntersectionObserver triggers CSS `@keyframes` with `animation-delay`. Avoid SplitText library. | 400ms per word, 40ms stagger, `cubic-bezier(0.22, 1, 0.36, 1)` | Apply ONLY to `.h1-section` — never `.display` (MASTER §3.1 locks the hero wordmark to a single static glyph). |
| **Scroll-reveal stagger for work list** | Work rows reveal in sequence (50–80ms stagger between rows) when WORK section enters viewport. | LOW — IntersectionObserver on `.work-list`, toggle parent class, use CSS `nth-child` animation-delay. | 300ms per row, 60ms stagger, `ease-out-quint` | One-shot per scroll-session. |
| **Chat bubble idle pulse (restored)** | MASTER §6.1 killed the GSAP pulse but explicitly left the door open ("restoration via CSS `@keyframes` if desired"). A 2.5s breathing pulse tells users chat is available without a label. | LOW — CSS `@keyframes` on `.chat-bubble`, 2.5s `ease-in-out` infinite, 1.0 → 1.04 scale. | 2500ms loop, `ease-in-out` | Pause on `prefers-reduced-motion` (media query wrapper). Pause on hover/focus (to avoid competing with functional state). |
| **Chat typing-dot bounce (restored)** | Already explicitly carved out in MASTER §6.1 ("looped CSS @keyframes when actively signaling state"). | LOW — CSS `@keyframes`, three dots with `animation-delay: 0s, 0.15s, 0.3s`. | 900ms loop, `ease-in-out` | Active only while `data-streaming` attr present on chat container. |
| **Chat panel open scale-in** | Panel currently appears instantly per MASTER §6.1 D-27 no-op. A 180ms scale-from-96%-and-fade-in feels app-native. | LOW — CSS transition on `.chat-panel[data-open]`. | 180ms, `cubic-bezier(0.22, 1, 0.36, 1)` | Paired with 120ms fade-out on close. |
| **Chat message stream "settle" fade** | Each streamed message fades in on append (very short, 120ms). Differentiates SSE streaming from raw DOM insert. | LOW — CSS `@keyframes` applied to `.chat-message` as it mounts. | 120ms, `ease-out` | Do not delay/stagger — messages arrive one at a time already. |
| **MobileMenu overlay fade-in** | MASTER §5.8 explicitly kills the entrance animation. Reconsider: a **200ms backdrop opacity fade** (no link stagger, no translation) is restrained enough to respect §5.8's intent while not feeling like a broken display-toggle. | LOW — CSS transition on overlay backdrop only. Links still instant. | 200ms, `ease` on backdrop only | **Requires MASTER §5.8 amendment.** Proposal to add: "backdrop opacity transition allowed; link reveal remains instant." |
| **View transitions between project case studies** | When navigating project → project, the `h2-project` title could morph via `view-transition-name`. Feels premium. | MEDIUM — requires `<ClientRouter />` re-enablement AND `view-transition-name: project-{slug}` on both the WorkRow title and the case study heading. | Browser-native, ~400ms default | **Conflicts with MASTER §6.1 "no ClientRouter"** and §8 "no `::view-transition-*` keyframes." Requires explicit amendment. Consider deferring past v1.2 unless roadmap accepts the revision. |

### 1.3 Anti-Features (explicitly NOT building — many already forbidden by MASTER.md)

Every entry below is either already banned by MASTER.md (cited) or a 2026 portfolio cliché that would contradict the editorial brief.

| Anti-Feature | Why Requested | Why Problematic | MASTER.md Status |
|--------------|---------------|-----------------|------------------|
| **Custom animated cursor / cursor trails** | Looks "designer-y" on agency sites. | Breaks accessibility (hides OS cursor affordances). Fails on touch. Reads as aesthetic-over-function — opposite of the editorial brief. | Not explicitly listed, but violates §6.4's "state transitions stay; orchestrated motion goes" and §7.1's signal-only accent rule. Add to anti-patterns. |
| **Magnetic buttons** (cursor-pull hover) | Trendy 2023–2025 micro-interaction. | Requires mouse-tracking JS, adds bundle weight, breaks the "signal, not decoration" accent rule. Zero value for recruiters evaluating engineering skill. | Add to anti-patterns. |
| **Background particles / noise canvas / WebGL hero** | Unique first impression. | v1.0 had one; v1.1 **deleted** it (MASTER §6.1: "CanvasHero.astro is deleted. No `<canvas>`... No WebGL"). | Explicitly forbidden — MASTER §8. |
| **Lenis smooth scroll / custom scroll hijack** | Makes pages "feel nicer." | Overrides platform scroll physics, incompatible with Astro page loads, kills Find-in-Page precision, fights `prefers-reduced-motion`. Known compatibility issues with Astro (stack research flags it). | Implicitly forbidden — `package.json` research notes it as "do not use." |
| **Parallax on hero or images** | Depth, visual interest. | Vestibular-motion trigger. Breaks on mobile. Reads as dated (peaked 2018). | Add to anti-patterns. |
| **Scroll-driven video scrub / long pin-to-viewport sequences** | Apple product-page aesthetic. | Massive asset weight, destroys LCP, incompatible with static SSG, requires GSAP ScrollTrigger (removed v1.1). | Forbidden — MASTER §6.1 "scroll-trigger animations are gone." |
| **Custom loading screen / splash** | "Premium" feel. | Static site LCP is under 2s already. A loading screen is literally slower than no loading screen. | Explicitly out-of-scope — PROJECT.md "Out of Scope" list. |
| **Orchestrated stagger on every section** | Feels "animated." | Turns every scroll into a performance. By the second section the recruiter is impatient, not impressed. | Use stagger **sparingly** — only on heading reveals and the one-time work-list entrance. |
| **Signature hero moment / hero animation** | Portfolios often have a "big first impression." | PROJECT.md milestone scope explicitly excludes this. The display wordmark is meant to be still. | Out of scope — v1.2 roadmap brief. |
| **Page transitions longer than 400ms** | "Cinematic." | Creates perceived slowness. 200–300ms is the app-feel threshold. | Enforce in spec. |
| **Animating `width` / `height` / `top` / `left`** | Easy to write. | Triggers layout reflow, jank on low-end devices. | Enforce: only `opacity`, `transform` (`translate`, `scale`), `color`. |
| **Animated emoji / Lottie files** | Cheap visual pop. | Off-brand for an editorial monochrome system; adds runtime JSON + lottie-web. | Implicit via §7 ("if a user can't click it, it can't be accent"). |
| **"Neon-glow" / box-shadow-on-hover cards** | Gaming / AI-startup aesthetic. | MASTER §8 forbids cards and `box-shadow` for work listings. | Explicitly forbidden — MASTER §8. |

### 1.4 Motion — Global Rules

These apply to *every* motion feature shipped in v1.2. They belong in an amendment to MASTER §6 rather than scattered across primitive specs.

- **Property whitelist:** `opacity`, `transform` (`translate`, `scale`), `color`, `background-color`, `text-decoration-color`, `outline-offset`, `letter-spacing` (with Safari subpixel caveat). Nothing else.
- **Duration bands:**
  - **State transitions** (hover/focus/active): 100–180ms
  - **Entrance animations** (scroll-reveal, page enter): 200–400ms
  - **Looped signals** (pulse, typing dots): 900–2500ms
  - **Nothing over 500ms for one-shot animation.**
- **Default easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) for entrance, `ease` for state changes, `ease-in-out` for loops.
- **Stagger default:** 40–80ms between siblings; never more than 6 staggered children in one sequence.
- **Reduced-motion contract:** Every new animation block is wrapped in `@media (prefers-reduced-motion: no-preference) { ... }` OR paired with a `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }` override. Functional color/underline transitions under 200ms are exempt (MASTER §6.3 precedent).
- **Reveal state default:** `[data-reveal]` elements start at final state (opacity 1, translate 0) — the JS ADDS the "hidden" class, IntersectionObserver removes it. This guarantees no-JS fallback renders correctly.
- **One-shot per session:** Scroll-reveal animations never re-trigger. IntersectionObserver unobserves after first intersection.

---

## 2. Chat Knowledge Approaches — Feature Landscape

The chat widget today uses a single `portfolio-context.json` fed into the Haiku system prompt. v1.2 goal: smarter answers to project-specific recruiter questions ("tell me about the X project," "what tech did he use for Y"). Below are the four viable approaches, with user-facing differences.

### 2.1 Comparison Matrix

| Approach | How It Works | Observable User Difference | Token Cost Per Query | Implementation Complexity | Best For |
|----------|-------------|----------------------------|----------------------|---------------------------|----------|
| **A. Context stuffing (current, improved)** | Concatenate all 6 project MDX frontmatter + abbreviated bodies + resume JSON into system prompt. Feed every query. | Fast, consistent answers. Occasionally misses nuance deep in a long case study. Quality of the curated `portfolio-context.json` is the ceiling. | ~4–8K input tokens per query (Haiku cached: ~$0.0004/query after first) | LOW — already built; just improve the context file | Portfolios with ≤10 projects and short bios. **This is Jack's case.** |
| **B. Per-project context (keyword routing)** | Simple keyword match on user query → select which project's MDX to include in system prompt. Default: list all project titles only; on match, inject full project content. | Faster first-token latency (smaller system prompt). Occasional misfire when query is ambiguous ("what's his best project?"). | ~1–3K input tokens per query (60–80% reduction vs A) | MEDIUM — requires routing layer in Worker | Portfolios where project content volume exceeds ~15K tokens total. |
| **C. Function-calling (tools)** | Expose `getProject(slug)`, `listProjects()`, `getResume()` as Anthropic tools. Model decides when to call. | Most *visible* polish — recruiter sees "let me look that up" behavior when asked about specific projects. Occasional extra round-trip adds 400–800ms to first answer. Risk: model hallucinates tool args. | Base query ~2K + tool invocations (each tool call = another message round-trip) | MEDIUM-HIGH — tool definitions, handlers in Worker, multi-turn orchestration | Portfolios wanting to *demonstrate* function-calling as a skill. Double-duty: the feature itself is a portfolio exhibit. |
| **D. RAG with vector embeddings** | Embed project MDX chunks to vector store (Cloudflare Vectorize, Pinecone, pgvector). On query, retrieve top-K chunks, inject into system prompt. | Best answer quality on deep, specific questions. Slowest first-token (100–300ms embed + retrieve overhead). Overkill for 6 projects. | ~1–2K input tokens per query + ~1K embedding cost | HIGH — embedding pipeline, vector DB, retrieval logic, reindex on content change | Portfolios with blog content, papers, or >50 retrievable documents. **Not worth it for 6 projects.** |

### 2.2 Recommendation

**Ship B (per-project keyword routing) as the v1.2 target, with A as the "everything always" fallback.**

Reasoning:
- The site has **exactly 6 projects + resume + bio** — small enough that full context stuffing (A) already fits in Haiku's 200K window with room to spare, even with full MDX bodies.
- Keyword routing (B) cuts steady-state cost ~70% without new infrastructure. Falls back to A gracefully when routing is uncertain.
- RAG (D) is engineering theater at this scale — the infrastructure doesn't earn its keep. Recruiters also see through it: building a RAG pipeline for 6 documents reads as "added complexity to look impressive."
- Function-calling (C) is seductive because it demonstrates a named skill, but the extra round-trip latency and hallucination risk cost more than the signal earns. **Revisit C post-v1.2** if Jack wants an explicit "AI tooling" project to add to the portfolio.

**Differentiator option to consider:** write a single `Projects/<slug>/README.md` per project (source-of-truth doc that seeds the MDX) and feed those — not the MDX — into the context. Keeps public case studies crisp while giving chat deeper material. This is already implied by the v1.2 scope ("update Projects/ folder docs as source-of-truth").

### 2.3 System Prompt / Persona Tuning (companion work)

Not a knowledge question, but in-scope for v1.2. Expected behaviors:

| Feature | What Good Looks Like |
|---------|----------------------|
| **Persona consistency** | Chat answers in third person about Jack ("Jack built this using..."), never first person. Never claims to *be* Jack. |
| **Scope bounds** | Declines to answer off-topic questions (politics, coding tasks, jokes) with a short redirect ("I only answer questions about Jack's work — what would you like to know?"). |
| **Recruiter-friendly defaults** | When asked "what's he looking for?", chat surfaces the one-line status from the homepage + links to resume/contact. |
| **Transparency** | When it doesn't know, it says so — never invents projects, companies, or technologies. |
| **Conversation cap respect** | Preserve v1.1 rate limit (5/60s), 50-msg localStorage cap, 24h TTL. No regression. |

---

## 3. Case Study Content Template

### 3.1 Strong Junior-Engineer Case Study Sections

Based on how Toptal, Semplice, UX Planet, and hiring-manager blog posts describe strong engineer case studies, and adjusted for editorial brevity (MASTER.md §3: `.body` max-width 68ch, avoid long prose walls). Target: **600–900 words per project**, readable in under 4 minutes.

### 3.2 Concrete Template (copy-paste-ready for each project MDX)

```mdx
---
title: "Project Name"
slug: "project-slug"
year: 2026
stack: ["Tool", "Tool", "Tool"]
role: "solo" | "team of N" | "contributor"
status: "shipped" | "archived" | "ongoing"
repo: "https://github.com/..."
live: "https://..."       # omit if none
summary: "One-sentence what-and-why — shows in work list and OG cards."
---

## Problem

One or two short paragraphs. What was broken / missing / interesting? Who felt the pain? Why did solving it matter? No jargon a non-engineer recruiter can't parse. End with the question the project answers.

## Approach

How Jack thought about it before coding. What assumptions he made. What he chose NOT to do. One paragraph — this is where engineering maturity shows. Name tradeoffs explicitly ("I considered X but picked Y because Z").

## Architecture

2–4 bullets or a short prose block. The one-screen mental model. Include a single code fence only if it's the clearest way to show something structural (file tree, data flow, one critical function). No tutorial-style walkthroughs.

## Key Tradeoffs

Bulleted list, 2–4 items. Each bullet: **Decision → Reason → Cost**. Example:
- **Cloudflare Workers over AWS Lambda** — zero cold start at edge, free tier covers expected load. Cost: stuck with Workers-compatible libs (no native Node APIs).
- **localStorage over IndexedDB for chat history** — 50-message cap + 24h TTL fits in 5MB quota. Cost: no cross-device sync.

## Outcome

What actually shipped. Concrete metrics if available (bundle size, Lighthouse, perf numbers, user count, deployment cadence). If no metrics, describe observable behavior ("site now handles X scenario that it couldn't before"). One paragraph max.

## What I Learned

The honest reflection. What Jack would do differently next time. A specific technique, pattern, or mental model he kept. This section signals self-awareness — the thing that separates junior engineers who'll grow from those who won't. One paragraph.

## Links

- [Repo](https://github.com/...)
- [Live](https://...) — omit if none
- [Commit that shipped it](https://github.com/.../commit/...) — optional, very nice when it fits
```

### 3.3 Section-Level Expectations

| Section | Words | Complexity | What a Recruiter Gets from It |
|---------|-------|------------|-------------------------------|
| Frontmatter | N/A | LOW | Scannable signal for 30-second scans (year, stack, role). |
| Problem | 80–150 | LOW — write once | "Does he understand why software gets built?" |
| Approach | 100–200 | MEDIUM — requires reflection | "Can he think before he types?" |
| Architecture | 100–200 + optional code | MEDIUM | "Does he have a mental model of systems?" |
| Key Tradeoffs | 100–200 (bulleted) | HIGH — this is the hardest section to write well | "Has he made real engineering decisions under constraint?" **This section is the single strongest junior-vs-senior signal.** |
| Outcome | 50–100 | LOW if metrics exist; HIGH if inventing signals | "Did the thing he built actually do the thing?" |
| What I Learned | 80–150 | HIGH — requires honesty | "Is he self-aware? Will he grow on the job?" |
| Links | N/A | LOW | Trust: recruiter can verify. |

### 3.4 Anti-Patterns in Case Study Writing

- **"Tutorial voice"** — walking through every step of the build. Recruiters don't need a how-to; they need the decisions.
- **Tech logos / skill icons** — forbidden by MASTER §8 ("no skill icons... no SVG illustrations"). Use the `stack` frontmatter array.
- **Marketing language** ("leveraged a cutting-edge stack to deliver seamless UX") — reads as insincere. Plain English only.
- **No tradeoffs section** — suggests junior engineer who didn't face any decisions, which is a lie.
- **No learnings section** — suggests the project taught him nothing, which is either true (bad project) or false (hidden humility, also bad).
- **Placeholder metrics** ("10x faster," "significantly better") without numbers. Either give a number or describe qualitatively.
- **Screenshots without context** — every image needs an alt that explains what it's showing and why it matters.

---

## 4. Analytics — Recruiter Engagement Signals

### 4.1 Platform Decision

**Plausible** is the best fit. Rationale:
- Privacy-friendly (no cookie banner needed, GDPR-safe) — a portfolio shouldn't have a cookie banner; it looks unprofessional.
- Native scroll-depth tracking in 2026 (no plugin required).
- Custom events via CSS class names or a small JS helper.
- <1KB script — doesn't regress the Lighthouse 100 performance score.
- Cloudflare Analytics is also zero-cost and bundled with Pages hosting, but its event model is weaker. Umami is a good alternative if Jack wants to self-host; functionally equivalent for events.

### 4.2 Events to Instrument (Ranked by Recruiter-Signal Value)

| Event | Type | Why It Matters | Implementation |
|-------|------|----------------|----------------|
| **Page view** (default) | Pageview | Baseline — which pages get visited, traffic source, device. | Automatic. |
| **Scroll depth per page** (default) | Built-in | How deep recruiters read on each page. Case study scroll depth is the clearest "engaged" signal short of chat. | Automatic — Plausible 2026 ships this natively. |
| **Time on page** (default) | Metric | Bounce rate + time on page + scroll depth together = engagement quality. | Automatic. |
| **Resume PDF download** | Custom event `Resume Download` | **The single strongest buying signal.** Recruiter who downloads the PDF is actively evaluating. | `onclick` event on `<a href="resume.pdf" download>` → `plausible('Resume Download')`. |
| **External link click — GitHub** | Custom event `Outbound: GitHub` (with `{ project: slug }` prop) | Shows which projects drove curiosity to verify on GitHub. | Click handler on `a[href*="github.com"]`. |
| **External link click — LinkedIn** | Custom event `Outbound: LinkedIn` | Recruiters who LinkedIn-click are moving toward contact. | Click handler. |
| **External link click — Email** (`mailto:`) | Custom event `Outbound: Email` | The conversion event — closest proxy to "they want to talk." | Click handler on `a[href^="mailto:"]`. |
| **Chat widget opened** | Custom event `Chat Open` | Interest in interactive engagement. Indicates recruiter wants more than the static copy. | Event fired from `chat.ts` when panel mounts. |
| **Chat message sent** (with `{ message_index: N }` prop) | Custom event `Chat Message` | How many turns. 3+ turns = strong engagement. Do NOT capture message content (privacy + PII). | Event fired per send. |
| **Project case study view** (with `{ project: slug }` prop) | Custom event `Project View` | Which projects drive the most interest. Informs which to feature higher on the index. | Fired from per-project layout `<script>`. |
| **Project live-link click** | Custom event `Outbound: Live` (with `{ project: slug }`) | Recruiter opened the live demo — high-intent. | Click handler. |
| **Project repo click** | Custom event `Outbound: Repo` (with `{ project: slug }`) | Same as above for GitHub repo links inside case studies. | Click handler. |
| **404 hits** | Custom event `404` | Hygiene — catches broken deep links. | Fired from 404 page. |

### 4.3 Events to Explicitly NOT Instrument

| Non-Event | Why Not |
|-----------|---------|
| Mouse movement / heatmaps | Over-instrumentation for a static portfolio. Adds weight. Invasive. Not GDPR-light. |
| Session replay | Same as above, plus privacy problem. |
| Individual chat message content | PII risk, no analytics value. |
| Form field focus events | No forms exist on the site (by design — PROJECT.md out-of-scope). |
| A/B test variants | No budget/volume to A/B a portfolio. |
| UTM tracking beyond default | Standard Plausible handles `utm_source`/`utm_medium`/`utm_campaign`. No custom taxonomy needed. |

### 4.4 Implementation Complexity

Whole analytics instrumentation is **LOW complexity** — two work units:
1. Add Plausible script tag to `BaseLayout.astro` head (+ `data-domain="jackcutrara.com"`).
2. Add a tiny `src/scripts/analytics.ts` (~30 lines) exposing `track(eventName, props?)` and wire it into:
   - Chat widget (`chat.ts`) for `Chat Open` and `Chat Message`
   - Resume download link (single `onclick`)
   - Global delegated click listener on `document` for `a[href^="http"]`, `a[href^="mailto"]`, `a[href$=".pdf"]` (handles every external link uniformly)
   - Per-project layout for `Project View`

The delegated click listener is the key — instrument once, cover every future link automatically.

---

## 5. Feature Dependencies

```
[Motion global rules amendment to MASTER §6]
    └──enables──> [All motion features below]

[Scroll-reveal IntersectionObserver primitive]
    └──enables──> [Section heading word-stagger]
    └──enables──> [Work list row stagger]

[Astro View Transitions re-enable]  (requires MASTER amendment)
    └──enables──> [Page enter fade]
    └──enables──> [Project → project morph (optional)]
    └──conflicts-with──> [Phase 7 chat persistence model] — must retest localStorage survives astro:after-swap

[Real project MDX content]
    └──enables──> [Chat knowledge upgrade] — chat context quality is gated on content quality
    └──enables──> [Case study scroll-depth metric] — no point measuring engagement on placeholder content

[Projects/ folder docs source-of-truth]
    └──feeds──> [Project MDX case studies]
    └──feeds──> [Chat context] — whichever knowledge approach is chosen

[portfolio-context.json improvements]
    └──blocks──> [Chat persona tuning] — can't tune persona without accurate facts
    └──blocks──> [Chat knowledge approach selection] — approach depends on final content volume

[Plausible script install]
    └──enables──> [All custom events]
    └──enables──> [Baseline metrics before other v1.2 work ships] — instrument FIRST to measure impact
```

### Dependency Notes

- **Analytics first:** Plausible should ship *before* content pass and motion layer so Jack has before/after data on engagement impact.
- **Content before chat:** Chat knowledge upgrades depend on real MDX content — do not tune system prompt against placeholder content.
- **Motion amendment before motion features:** Writing the MASTER §6 amendment (property whitelist, duration bands, reveal primitive spec) once is cheaper than re-arguing the rules per primitive.
- **View Transitions conflict:** Re-enabling `<ClientRouter />` (required for native Astro page-fade) conflicts with MASTER §6.1. Decision needed in roadmap: either (a) amend §6.1 to carve out View Transitions, (b) use a CSS-only crossfade that doesn't need ClientRouter, or (c) skip page-enter motion in v1.2.

---

## 6. v1.2 Feature Prioritization Matrix

| Feature | Recruiter Value | Implementation Cost | Priority |
|---------|----------------|---------------------|----------|
| Real project MDX content (4 files) | HIGH — placeholder content is the single biggest credibility leak | MEDIUM — writing is the work; no code | **P1** |
| Plausible instrumentation | MEDIUM — invisible to recruiters; high value to Jack for iteration | LOW | **P1** |
| Scroll-reveal (sections + work list) | MEDIUM-HIGH — site feels alive, remains editorial | LOW | **P1** |
| Hover microinteractions (WorkRow arrow slide) | MEDIUM — polish signal | LOW | **P1** |
| Chat persona + system prompt tuning | HIGH — one great chat answer beats a pretty animation | LOW (just prompt work) | **P1** |
| Chat knowledge approach (keyword routing) | MEDIUM | MEDIUM | **P2** |
| Page enter fade via View Transitions | MEDIUM | MEDIUM — MASTER amendment needed | **P2** |
| Chat pulse / typing dots (restored) | LOW-MEDIUM — chat is already a differentiator; motion adds polish | LOW | **P2** |
| Heading word-stagger | LOW-MEDIUM — nice-to-have | MEDIUM | **P2** |
| Project → project view transition morph | LOW — impressive but niche, most users don't navigate project→project | HIGH — conflicts with MASTER | **P3** |
| About page narrative audit | MEDIUM — already decent per v1.1 audit | LOW | **P2** |
| Homepage/resume copy audit | LOW-MEDIUM — current copy is current | LOW | **P2** |
| 7 tech debt items | LOW individually, MEDIUM cumulatively (hygiene + future-proofing) | LOW-MEDIUM | **P2** |

**Priority key:** P1 = must ship for v1.2. P2 = should ship. P3 = defer.

---

## 7. Dependencies on Existing v1.1 Surface

Features in v1.2 will *touch* the following v1.1 surfaces. The roadmap must budget amendment or integration work against each.

| v1.1 Surface | v1.2 Work That Touches It | Amendment Needed? |
|--------------|---------------------------|-------------------|
| `MASTER.md §6` (Motion) | Motion layer — scroll reveal, page enter, pulse restore | **YES** — add §6.5 "v1.2 motion extensions" with property whitelist, duration bands, reveal primitive spec. The existing §6.1 dead-list has to stay; add carve-outs explicitly. |
| `MASTER.md §5.5` (WorkRow) | Arrow slide-in, optional letter-spacing tighten | **YES** — additive amendment to §5.5 motion line ("opacity + 4px translateX"). |
| `MASTER.md §5.8` (MobileMenu) | Backdrop fade-in | **YES** — §5.8 currently says "overlay opens instantly via display toggle only." Amendment: allow backdrop opacity transition; keep links instant. |
| `MASTER.md §6.1 D-27` (Chat motion no-ops) | Chat pulse / typing / panel scale-in restored | **PARTIAL** — §6.1 already carves out "looped CSS @keyframes when actively signaling state" and notes "restoration via CSS @keyframes if desired." Formalize as a Phase 10 follow-through item in §6 changelog. |
| `MASTER.md §8` (Anti-patterns) | View transitions re-enable | **YES** — §8 forbids `<ClientRouter />` and `::view-transition-*` keyframes. Remove those bullets OR scope them to "v1.1-era removals, reinstatable with justification." |
| `src/scripts/chat.ts` | Chat knowledge approach, persona tuning, analytics events | **NO** — additive. Preserve Phase 7 architecture (SSE, focus trap, DOMPurify, rate limit). |
| `src/content/projects/*.mdx` | Content pass | **NO** — content work only; Zod schema unchanged unless case study template proposes new frontmatter fields. |
| `src/pages/api/chat.ts` | Chat knowledge (routing logic) | **NO** — additive. |
| `BaseLayout.astro` | Plausible script, optional `<ClientRouter />` | **PARTIAL** — script injection is trivial; ClientRouter decision gated on §8 amendment. |
| `v1.1-MILESTONE-AUDIT.md` 7 tech debt items | Individual fixes | **NO** — documented as v1.1 known issues. |

---

## 8. Out of Scope for v1.2

Restating for clarity — these are NOT v1.2 features. Revisit post-v1.2.

- **Signature hero moment / hero animation** — PROJECT.md milestone scope excludes it.
- **Dark mode** — permanently dead (MASTER §8).
- **Blog / writing section** — PROJECT.md out-of-scope.
- **CMS / contact form** — PROJECT.md out-of-scope.
- **Function-calling chat tools (C)** — defer; not worth the complexity at current content volume.
- **RAG pipeline (D)** — defer; doesn't earn its keep for 6 projects.
- **Three.js / WebGL / Canvas anything** — permanently dead.
- **Custom cursor / mouse effects** — add to anti-patterns list during MASTER §6 amendment.
- **Skills graphics / progress bars / GitHub contribution graph** — forbidden by MASTER §8 and PROJECT.md.

---

## Sources

### Motion
- [10 Websites with Great Animation in 2026 — School of Motion](https://www.schoolofmotion.com/blog/10-websites-with-great-animation-in-2026) — HIGH (confirms "restrained sophistication" as the 2026 aesthetic)
- [Scroll-Triggered Animation best practices — Motion docs](https://motion.dev/docs/react-scroll-animations) — HIGH (duration/easing references; confirms transform+opacity-only rule)
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) — HIGH (fade/slide/none built-in, prefers-reduced-motion auto-disable)
- [IntersectionObserver fade-in patterns — dev.to aggregation](https://dev.to/ljcdev/introduction-to-scroll-animations-with-intersection-observer-d05) — MEDIUM (pattern validation; 250–300ms duration sweet spot)
- [Rauno Freiberg — Killer Portfolio feature](https://www.killerportfolio.com/by/rauno-freiberg) — MEDIUM (reference for "invisible details" microinteraction philosophy)
- [Brian Lovin — brianlovin.com](https://brianlovin.com/) — MEDIUM (reference for editorial polish in product-design portfolio)
- [Invisible Details of Interaction Design — Rauno Freiberg](https://every.to/p/invisible-details-of-interaction-design) — HIGH (canonical essay on microinteraction restraint)
- [Lenis smooth-scroll — known issues with Astro](https://github.com/darkroomengineering/lenis) — MEDIUM (confirms Astro compatibility concerns)

### Chat Knowledge
- [RAG vs Context Stuffing — MarkTechPost](https://www.marktechpost.com/2026/02/24/rag-vs-context-stuffing-why-selective-retrieval-is-more-efficient-and-reliable-than-dumping-all-data-into-the-prompt/) — HIGH (benchmark: RAG 278 vs stuffing 775 tokens, 1250x cost efficiency at scale)
- [Building Ask — RAG portfolio chatbot — Cameron Rye](https://rye.dev/blog/building-ask-rag-portfolio-chatbot/) — MEDIUM (real-world portfolio RAG case study)
- [Shane Drumm — 10,000 → 600 token chatbot optimization](https://shanedrumm.com/my-first-agent-the-shane-chatbot/) — HIGH (concrete optimization: keyword routing saved 94% tokens)
- [Function Calling with LLMs — Prompting Guide](https://www.promptingguide.ai/applications/function_calling) — HIGH (function-calling semantics; system prompt reinforcement pattern)
- [RAG vs Function Calling — Stream](https://getstream.io/blog/rag-function-calling/) — MEDIUM (comparison framing)
- [Claude Haiku 4.5 Pricing](https://pricepertoken.com/pricing-page/model/anthropic-claude-haiku-4.5) — HIGH ($1/M input, $5/M output; 90% discount on cached input)

### Case Study Structure
- [UX Case Study Structure — uxfol.io](https://blog.uxfol.io/ux-case-study-structure/) — HIGH (recruiter-logic structure)
- [All About Process: Dissecting Case Study Portfolios — Toptal](https://www.toptal.com/designers/ui/case-study-portfolio) — HIGH (problem/approach/outcome pattern validation)
- [How to Write a Case Study for Design Portfolio — Format](https://www.format.com/magazine/resources/design/how-to-write-design-case-study) — MEDIUM (800–1500 words guideline)
- [UX Portfolio Case Study Template — UX Planet / Calvin](https://uxplanet.org/ux-portfolio-case-study-template-plus-examples-from-successful-hires-86d5b0faa2d6) — MEDIUM

### Analytics
- [Plausible Custom Events docs](https://plausible.io/docs/custom-event-goals) — HIGH
- [Plausible Scroll Depth Tracking docs](https://plausible.io/docs/scroll-depth) — HIGH (native in 2026, no plugin needed)
- [Plausible Custom Properties docs](https://plausible.io/docs/custom-props/introduction) — HIGH (required for per-project props)
- [plausible-tracker npm](https://github.com/plausible/plausible-tracker) — HIGH (tracker helper library)
- [Tracking Scroll Depth for Engagement — BugFactory](https://bugfactory.io/articles/tracking-scroll-depth-to-measure-visitor-engagement/) — MEDIUM

---

*Feature research for: personal portfolio v1.2 polish milestone*
*Researched: 2026-04-15*
