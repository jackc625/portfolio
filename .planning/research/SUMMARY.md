# Project Research Summary — v1.2 Polish

**Project:** Jack Cutrara — Portfolio Website (jackcutrara.com)
**Domain:** Polish milestone (v1.2) on a shipped Astro 6 editorial portfolio
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

v1.2 Polish is an additive milestone on top of the shipped v1.1 editorial system (Astro 6 / Tailwind v4 / Geist / Cloudflare Pages+Workers / Lighthouse 100/95/100/100). Research covers five capability areas layered onto a locked design contract: tasteful motion, full content pass on 4 placeholder project MDX files, smarter chat knowledge, seven v1.1 tech debt items, and analytics instrumentation.

The strongest signal across all four research files is **restraint reinforced by native platform capability**. v1.1 deliberately removed GSAP and `<ClientRouter />` and replaced `transition:persist` with localStorage chat persistence. Every researcher independently converged: **do not reintroduce either**. 2026 browser baseline (`@starting-style`, cross-document `@view-transition`, `animation-timeline: view()`, `inert`) covers every v1.2 motion need — zero new npm dependencies, no break to the Phase 7 chat lifecycle contract, no subtractive amendment to MASTER.md's anti-pattern list.

Chat knowledge converges on the same thesis at the AI layer: corpus is ~10–20k tokens (7–10% of Haiku 4.5's 200k window), so **context-stuffing + Anthropic prompt caching beats RAG on every axis** (accuracy, latency, cost, complexity, freshness).

The biggest risk is **cross-phase collision with Phase 7 chat**. `src/scripts/chat.ts` + `src/pages/api/chat.ts` encode ~15 load-bearing decisions (marked `async:false`, exact-origin CORS, DOMPurify strict whitelist, 30s AbortController, 5/60s rate limit, focus-trap re-query on every Tab, dual idempotency guards). v1.2 must treat the Phase 7 regression battery as a milestone-level gate because 3 of 5 capability areas touch those files.

## Key Findings

### Recommended Stack — Zero New Dependencies (Preferred Path)

- **Native CSS (`@starting-style` + cross-document `@view-transition`)** — page-enter fades + view transitions. Baseline 2026. Unsupported browsers get instant navigation (correct degradation).
- **IntersectionObserver + CSS class toggle** — scroll-reveal. ~20 LOC utility, one-shot-per-element.
- **Context stuffing + Anthropic prompt caching** (`cache_control: { type: "ephemeral" }`) — cache-read is 0.1× base input price. Haiku 4.5's 4096-token cache minimum easily cleared.
- **Build-time codegen** (`scripts/build-chat-context.mjs`) — merges project MDX + About + Resume into `portfolio-context.json`, regenerated every build.
- **Plausible Cloud ($9/mo) primary + Cloudflare Web Analytics (free) secondary** — cookie-free, no consent banner. Umami Cloud free tier is budget fallback.

Optional additions — `motion` v12.38.x (~5 kB) if a single microinteraction needs spring physics, `gray-matter` if a Projects/ → MDX sync script is built — are fallbacks, not defaults.

### Expected Features

**Must have (table stakes):**
- Page enter fade (native cross-document View Transitions, 200–300ms `ease-out`, auto-disables under reduced-motion)
- Scroll-reveal on below-fold sections (fade + ≤12px translateY, 250–350ms, one-shot)
- Real content on all 6 project MDX files (4 currently placeholder — biggest credibility leak)
- Analytics instrumentation (invisible to recruiters, critical for Jack's iteration)
- Chat persona + system prompt tuning on real content

**Should have (differentiators):**
- WorkRow arrow slide-in (opacity 0→1 + 4px translateX, 180ms)
- Chat bubble idle pulse (restored via CSS, paused on hover/focus/reduced-motion)
- Chat panel open scale-in (180ms, 96%→100%)
- Typing-dot bounce during SSE streaming (carved out OK per MASTER §6.1)
- Section heading word-stagger on `.h1-section` only (never `.display`)

**Explicitly deferred (v1.3+):**
- Signature hero moment — user-excluded
- Project → project view-transition-name morph — high MASTER amendment cost
- RAG / vector DB — revisit past ~150k token corpus
- Function-calling chat tools — triples SSE streaming complexity for marginal signal
- Blog / CMS / contact form — PROJECT.md out-of-scope

### Architecture Approach

~300 LOC of net new code: two build scripts, two client scripts, mods to 6 Astro components, additions to `global.css`, `BaseLayout.astro` updates.

1. **Motion layer** — `src/scripts/motion.ts` (IntersectionObserver, mirrors chat.ts init-guard + `astro:page-load` pattern) + CSS in `global.css` + per-primitive scoped `<style>` microinteractions.
2. **Chat knowledge layer** — `scripts/build-chat-context.mjs`; split `portfolio-context.static.json` (human-authored) from generated `portfolio-context.json`; `<project-deep-dive>` block in system prompt; `cache_control: ephemeral` on knowledge block; `max_tokens` 512→768.
3. **Analytics bridge** — `src/scripts/analytics.ts` listens to existing `chat:analytics` CustomEvent (content-free per Phase 7 D-36) and forwards to `window.plausible()`; delegated click listener for outbound links + mailto + PDF.
4. **Content pipeline** — `Projects/*.md` is source of truth; `scripts/sync-projects.mjs` translates body only into `src/content/projects/*.mdx`; frontmatter stays human-authored; `astro check` enforces Zod schema.
5. **Tech debt sweep** — scoped fixes: MobileMenu (`inert`), chat.ts (copy button normalization), global.css (#666 → `var(--ink-muted)`), BaseLayout OG URL verify.

### Critical Pitfalls

1. **Phase 7 chat regression** — ~15 load-bearing invariants can break silently. Every phase touching BaseLayout / global.css / chat.ts / api/chat.ts runs the Phase 7 regression battery before merging.
2. **Motion regresses Lighthouse 100** — any new runtime dep, 30+ observer targets, or stuck `will-change` drops Performance to 92–98. Mitigation: zero new deps, CSS-only, Lighthouse CI gate (Performance ≥99, TBT ≤150ms, CLS ≤0.01).
3. **View Transitions + chat persistence collision** — re-adding `<ClientRouter />` breaks localStorage chat persistence. Mitigation: cross-document `@view-transition` CSS at-rule; works with full page reloads.
4. **RAG over-engineering for 6 documents** — indefensible for ~15–30 chunks. Mitigation: first task of chat phase is corpus token count; <50k → context-stuffing + caching, reject RAG.
5. **System prompt / PII leakage** — richer knowledge = more surface for injection. Mitigation: content allowlist (no resume PDF contents), refusal instructions, MDX injection-pattern stripping at index time, prompt-injection test battery.

## Cross-Cutting Synthesis

### Tensions & Resolutions

| Tension | Resolution |
|---------|------------|
| Chat knowledge: keyword routing vs context-stuffing vs RAG | Ship **build-time codegen + `cache_control: ephemeral`**. Keyword routing is a v1.3 optimization if $/mo steady-state exceeds $5. |
| Content pass tooling: script vs manual | **Build `scripts/sync-projects.mjs`** — auditable via git diff, prevents the drift that created 4-of-6 placeholder state. Idempotent, manual-trigger. |
| Analytics tool choice | **Plausible primary + CF Web Analytics secondary.** Umami Cloud fallback only if $9/mo is a hard blocker. |
| Motion scope: ClientRouter vs CSS-only | **Cross-document `@view-transition` CSS at-rule only.** Works with full-page navigation, no JS router, preserves chat persistence. |

### Consensus (non-negotiable across all 4 researchers)

- Do NOT reintroduce GSAP
- Do NOT reintroduce `<ClientRouter />`
- Do NOT build RAG for v1.2
- Motion is CSS-first with JS only for IntersectionObserver reveal
- `prefers-reduced-motion` is the first check in every motion feature
- Content pass unblocks chat — real MDX content feeds chat knowledge; sequencing matters
- Phase 7 invariants are load-bearing — documented with D-# tags in STATE.md

### Milestone-Level Constraints (apply to every phase)

- **D-26 Chat Regression Gate** — any phase touching BaseLayout / global.css / chat.ts / api/chat.ts runs the Phase 7 regression battery (XSS, CORS, rate limit, timeout, prompt injection, focus trap, persistence, streaming, markdown, clipboard).
- **Lighthouse gate** — every phase ends with Lighthouse CI on homepage + one project detail page; Performance ≥99 / A11y ≥95 / BP 100 / SEO 100.
- **Zero new runtime dependencies (preferred path)** — additions justified in writing at phase-plan time.
- **No subtractive MASTER.md amendments** — motion additions are additive carve-outs in §5/§6; §8 anti-pattern list stays.
- **Reduced-motion contract** — every new animation wrapped in `@media (prefers-reduced-motion: no-preference)` or paired with `reduce` override.

## Implications for Roadmap

All 4 researchers converged on the same 5-phase structure and ordering:

### Phase 12 — Tech Debt Sweep (FIRST)
**Why first:** Every subsequent phase touches debt files. Doing debt after motion means re-testing motion after debt fixes.
**Delivers:** All 7 v1.1 audit items closed or documented accepted; zero `pnpm build` warnings.

### Phase 13 — Content Pass + Projects/ Sync
**Why second:** Chat (Phase 14) reads this content. Chat first embeds placeholder prose in cached system prompt.
**Delivers:** 4 placeholder MDX → real case studies; About audit; homepage + resume copy verified; `scripts/sync-projects.mjs`; `docs/CONTENT-SCHEMA.md` + `docs/VOICE-GUIDE.md`.

### Phase 14 — Chat Knowledge Upgrade
**Why third:** Depends on Phase 13 real content.
**Delivers:** `scripts/build-chat-context.mjs` in build chain; JSON split; `cache_control: ephemeral`; `max_tokens` 512→768; persona + scope-bound refusal; prompt-injection test battery; content allowlist.

### Phase 15 — Analytics Instrumentation
**Why fourth:** Ships before motion to measure motion's engagement impact. Can parallelize with 13/14. Content before analytics so baseline measures real site.
**Delivers:** Plausible + CF Web Analytics in BaseLayout; `analytics.ts` forwarding `chat:analytics`; delegated outbound-link listener; env-gate on exact hostname; no cookie banner.

### Phase 16 — Motion Layer (LAST)
**Why last:** MASTER §6 — motion layers ON TOP of a stable system. Motion on placeholder content reads broken.
**Delivers:** `motion.ts` IntersectionObserver; `global.css` motion layer; per-primitive microinteractions; reduced-motion safety net.

## Open Questions for Jack (resolve before requirements)

1. **Analytics budget:** Plausible Cloud ($9/mo primary) or Umami Cloud (free fallback)?
2. **Tech debt #7 (`--ink-faint` contrast):** Accept as documented trade-off or darken to `#71717A`? Route through frontend-design skill.
3. **Projects/ → MDX sync tooling:** Build `scripts/sync-projects.mjs` now or manual-only for this milestone?
4. **Chat persona voice:** Confirm third-person default ("Jack built this...") with first-person past tense only in quotes.
5. **Scope cap philosophy:** Is shipping 80% of Phase 16 Motion acceptable if Lighthouse gate breaks? ("ship 80% polished > ship 100% fragile"?)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All additions verified against official docs; 2026 browser baseline confirmed; zero-dep path validated. |
| Features | HIGH / MEDIUM | HIGH for motion/analytics/case studies. MEDIUM for chat knowledge (choice depends on final corpus size). |
| Architecture | HIGH | Integration surface fully mapped by reading src/ + v1.1-MILESTONE-AUDIT.md + MASTER.md. |
| Pitfalls | HIGH | Grounded in STATE.md D-# decisions, v1.1 audit, MASTER anti-pattern list. |

**Overall confidence:** HIGH
