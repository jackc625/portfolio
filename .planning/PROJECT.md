# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara built with Astro 6, Tailwind CSS v4, and Geist typography. The site showcases six real project case studies, technical ability, and professional polish — functioning as a living complement to his resume that positions him as a serious, capable junior software engineer worth interviewing. Live at jackcutrara.com.

After v1.2 the site ships with a tasteful motion layer, a knowledge-grounded chat widget powered by Anthropic prompt caching, privacy-respecting analytics measuring recruiter engagement, and a locked editorial design system documented in `design-system/MASTER.md` + `design-system/MOTION.md`.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Current State

**Shipped:** v1.2 Polish (2026-04-27)
**Live at:** jackcutrara.com (Cloudflare Pages + Cloudflare Workers SSR for `/api/chat`)
**Tech stack:** Astro 6 + Tailwind CSS v4 + TypeScript (strict) + MDX + Cloudflare Pages/Workers + Geist/Geist Mono typography
**Source LOC:** ~4,715 (src/ — astro, ts, css, mdx, md)
**Repo:** github.com/jackc625/portfolio (public)
**Lighthouse (production-on-Cloudflare-edge canonical gate):** Performance 100 / Accessibility 95 / Best Practices 100 / SEO 100; motion-specific TBT=0ms / CLS≈0.0016
**Design contract:** `design-system/MASTER.md` (locked editorial system) + `design-system/MOTION.md` (additive motion carve-outs); 6-hex palette, Geist/Geist Mono, restrained motion respecting `prefers-reduced-motion`
**Chat:** Claude Haiku via Anthropic SDK with `cache_control: ephemeral`; `portfolio-context.json` regenerated at build time from MDX + About + Resume; D-26 regression battery 117/117 GREEN; D-15 server byte-identical phase-wide
**Analytics:** Umami Cloud + Cloudflare Web Analytics live in production; cookie-free, no consent banner; recruiter-engagement events visible end-to-end

## Requirements

### Validated

- ✓ Modern, high-performance tech stack — v1.0 (Astro 6 + Tailwind v4 + TypeScript strict)
- ✓ Custom domain with HTTPS — v1.0 (jackcutrara.com on Cloudflare Pages)
- ✓ Content collection system for projects — v1.0 (Zod schema + MDX)
- ✓ Multi-page site (Home, About, Projects, Resume, Contact) — v1.0
- ✓ Home page with generative canvas hero — v1.0 (replaced in v1.1 by editorial display hero)
- ✓ About page with narrative and skills — v1.0
- ✓ Resume page with PDF download — v1.0 (replaced in v1.1 by inline download link)
- ✓ Contact page with email/LinkedIn/GitHub — v1.0
- ✓ Responsive design across breakpoints — v1.0
- ✓ Project card grid with 6 projects — v1.0 (replaced in v1.1 by numbered work list)
- ✓ Structured case study pages — v1.0 (2 fully written; remaining 4 filled in v1.2)
- ✓ Dual reading modes (recruiter scan + engineer deep dive) — v1.0
- ✓ Dark/light theme with persistent toggle — v1.0 (removed in v1.1)
- ✓ GSAP scroll animations and page transitions — v1.0 (removed in v1.1; replaced by native motion in v1.2)
- ✓ Hover micro-interactions — v1.0
- ✓ Print-friendly resume — v1.0
- ✓ JSON-LD structured data — v1.0
- ✓ SEO meta (title, description, OG tags) per page — v1.0
- ✓ Semantic HTML with accessibility — v1.0
- ✓ Keyboard navigation with focus indicators — v1.0
- ✓ Lighthouse 90+ all categories — v1.0
- ✓ Sub-2s LCP, CLS < 0.1 — v1.0
- ✓ Optimized images with lazy loading — v1.0
- ✓ prefers-reduced-motion respect — v1.0

- ✓ Editorial design system with locked MASTER.md contract — v1.1
- ✓ Geist + Geist Mono typography via Astro 6 Fonts API — v1.1
- ✓ Warm off-white #FAFAF7 + signal red #E63946 hex palette — v1.1
- ✓ Single light theme (dark mode removed) — v1.1
- ✓ Numbered editorial work list replacing card grid — v1.1
- ✓ Restrained motion (GSAP/scroll animations removed) — v1.1
- ✓ Chat widget restyled to editorial chrome — v1.1
- ✓ Lighthouse 90+ maintained after redesign — v1.1
- ✓ WCAG AA contrast verified — v1.1
- ✓ Full keyboard accessibility with visible focus rings — v1.1

- ✓ Zero v1.1 audit items outstanding — DEBT-01..06 closed (zero `pnpm build` warnings, MobileMenu inert extends to `.chat-widget`, OG URLs production-correct, chat copy-button parity, MASTER.md §2.4 token exceptions, all 7 carry-forward items annotated) — v1.2 (Phase 12)
- ✓ Real case studies on all 6 projects + `Projects/` → MDX sync pipeline — CONT-01..07 closed (600–900 word case studies, Problem→Approach→Architecture→Tradeoffs→Outcome→Learnings, idempotent `scripts/sync-projects.mjs`, CONTENT-SCHEMA + VOICE-GUIDE published) — v1.2 (Phase 13)
- ✓ Chat knowledge upgrade — build-time `portfolio-context.json`, Anthropic prompt caching, third-person persona, prompt-injection hardening, max_tokens 768→1500 + truncation observability — CHAT-03..09 closed — v1.2 (Phase 14)
- ✓ Privacy-respecting analytics — Umami Cloud + Cloudflare Web Analytics live in production with cookie-free recruiter-engagement events (resume download, chat open, outbound clicks, project scroll depth, `chat_truncated`) — ANAL-01..06 closed — v1.2 (Phase 15)
- ✓ Tasteful motion layer — cross-document `@view-transition` fade, IntersectionObserver scroll-reveal, WorkRow arrow, chat bubble pulse, chat panel scale-in, typing-dot bounce, `.h1-section` word-stagger — reduced-motion contract held, zero new runtime deps, Lighthouse motion-specific gate PASS (TBT=0ms / CLS≈0.0016), D-26 117/117 GREEN, manual UAT 13/13 PASS — MOTN-01..10 closed — v1.2 (Phase 16)

### Active

(No active requirements — v1.2 Polish closed 2026-04-27. Next milestone TBD via `/gsd-new-milestone`.)

## Next Milestone Goals

v1.3 scope is open. Candidates carried from v1.2 Future / Out-of-Scope (re-evaluate at next milestone planning):

- Signature hero moment / hero animation (deferred from v1.2)
- Project → project view-transition-name morph (cross-document named-element morphs)
- Keyword routing for chat knowledge (only if steady-state Anthropic spend exceeds ~$5/mo)
- RAG / vector DB for chat (revisit past ~150k token corpus size)
- Function-calling chat tools (`getProject`, `listProjects`) — previously dropped: tripled SSE streaming complexity for marginal signal

Pre-existing pending todos to triage:

- `2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md` (UX revision)
- `2026-04-15-design-and-ship-og-default-image.md` (content)
- `2026-04-23-configure-chat-rate-limiter-binding.md` (Cloudflare binding never set on Production/Preview; pre-existing Phase 7 carry-forward)
- `2026-04-23-chat-cache-hit-rate-observability.md` (Phase 14 deferred)
- `build:chat-context:check` CI enforcement (Phase 14 cross-phase concern; recommend parallel job in `.github/workflows/sync-check.yml`)

### Out of Scope

- Blog / writing section — not committed to writing cadence
- Testimonials — no content source
- CMS — static content sufficient
- Contact form — direct links (email, LinkedIn) more professional for this audience
- 3D / Three.js / canvas — bloats bundle, kills mobile performance
- Skills progress bars / GitHub contribution graph — amateurish signals
- Real-time chat / voice — chatbot covers Q&A sufficiently
- Background audio / custom loading screens — accessibility + performance anti-patterns
- Reintroducing GSAP — removed in v1.1 for a reason; native 2026 platform covered v1.2 motion needs without runtime deps
- Reintroducing `<ClientRouter />` — collides with Phase 7 localStorage chat persistence; v1.2 Phase 16 used cross-document `@view-transition` CSS at-rule instead

## Context

**v1.2 Polish (2026-04-15 → 2026-04-27, 12 days):** 5 phases (12-16), 34 plans, 213 commits, 132 code/config files (+5946 / -470 LOC). Source LOC climbed from ~3,859 to ~4,715. All 36 v1.2 requirements satisfied per milestone audit (3-source cross-reference: VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md). 5/5 phases verified, 5/5 E2E recruiter flows pass, 31/33 cross-phase integration points wired (1 PARTIAL: `build:chat-context:check` CI enforcement deferred; 0 BROKEN). All cross-phase gates HELD (D-26 chat regression, D-15 server byte-identical, Lighthouse CI, reduced-motion contract, zero new runtime deps, no subtractive MASTER.md amendments).

**v1.1 Editorial Redesign (2026-04-07 → 2026-04-15):** 4 phases (8-11), 27 plans, 63 tasks, ~150 commits over 9 days. Source LOC ~2,875 → ~3,859. Design contract locked at `design-system/MASTER.md`.

**v1.0 MVP (2026-03-22 → 2026-04-04):** 6 phases + Phase 7 chatbot, 27 plans + 5 plans, 43 tasks. Initial Astro 6 + Tailwind v4 + TypeScript foundation deployed to Cloudflare Pages.

**Known issues / tech debt carried into v1.3:**

- `CHAT_RATE_LIMITER` Cloudflare binding never configured on Production or Preview (pre-existing Phase 7 carry-forward; rate-limiter code path defensively skips when binding absent — code path byte-identical from Phase 7)
- Chat cache-hit-rate observability not yet wired (Phase 14 deferred)
- `build:chat-context:check` not enforced in CI (deploy auto-regenerates so production never stale, but PRs cannot fail-fast on local drift)
- Lighthouse Performance ≥99 on localhost not held (Phase 16 home 80 / project 81); accepted per Phase 15 §9 production-on-Cloudflare-edge canonical-gate precedent. Motion-specific TBT=0 / CLS≈0 PASS comfortably.
- WR-01 bootstrap listener registers without dedup (`analytics.ts:140-147`, `scroll-depth.ts:63-70`, `chat.ts:870-877`) — long sessions could accumulate `astro:page-load` listeners; no observable double-count due to `*Initialized` guards
- `#chat-panel` display contract is JS-coupled (`animatePanelOpen` flips `style.display='flex'` directly; `.is-open` only animates) — fragile but no current break

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro 6 + Tailwind v4 + TypeScript | Modern + best performance, research-driven | ✓ Good — zero-JS pages, fast builds |
| Cloudflare Pages deployment | Unlimited bandwidth, fastest edge, Astro-owned | ✓ Good — live at jackcutrara.com |
| GSAP for animations (v1.0) | ScrollTrigger + SplitText premium feel | — Replaced in v1.1 by restrained motion; v1.2 used native CSS/IntersectionObserver instead |
| Clone shiyunlu.com design language | Need specific reference to avoid generic AI designs | ✓ Good — distinctive visual identity |
| Canvas hero with simplex noise (v1.0) | Unique first impression, differentiator | — Replaced in v1.1 by editorial display hero |
| Dark-first OKLCH token system (v1.0) | Modern color space, theme-switchable via CSS vars | — Replaced in v1.1 by flat 6-hex palette |
| Content collections + MDX | Type-safe project content with component support | ✓ Good — placeholder-friendly workflow + sync-pipeline source-of-truth |
| Locked editorial design system (v1.1) | Restraint over motion — MASTER.md as single source of truth | ✓ Good — Lighthouse 100/95/100/100, distinctive visual identity |
| Flat hex tokens replacing OKLCH (v1.1) | Simpler mental model, single light theme eliminates theme machinery | ✓ Good — dead theme code removed, smaller surface area |
| localStorage chat persistence replacing transition:persist (v1.1) | ClientRouter removed; localStorage survives the navigation model | ✓ Good — 50-msg cap + 24h TTL preserves UX without DOM persistence |
| MobileMenu container query (v1.1) | `@container (max-width: 380px)` is true signal, not viewport width | ✓ Good — hamburger appears when nav actually wraps |
| `Projects/*.md` as authoritative source for case-study bodies (v1.2) | Single source of truth + reviewable diff pipeline | ✓ Good — idempotent `sync-projects.mjs`, MDX frontmatter human-authored, Zod-validated |
| Anthropic `cache_control: ephemeral` on chat knowledge block (v1.2) | Hit cache-read pricing for repeated context | ✓ Good — build-time generation + cached system block |
| Native motion stack (v1.2) — `@view-transition` + IntersectionObserver + CSS keyframes | Zero new runtime deps, native reduced-motion support | ✓ Good — Phase 16 shipped tasteful motion without reintroducing GSAP |
| Per-primitive scoped reduce-overrides D-14 (v1.2) | Confines motion contract to primitive boundary; neutralizers live in primitive's own `<style>` | ✓ Good — WorkRow scoped, chat-bubble globally scoped (no scoped-island available) |
| Production-on-Cloudflare-edge as canonical Lighthouse gate (v1.2) | Localhost simulated-throttled-4G LCP/FCP is upstream artifact, not motion regression | ✓ Good — Phase 15 §9 precedent carried into Phase 16 |
| Umami Cloud + CF Web Analytics, no consent banner (v1.2) | Cookie-free by design; privacy-respecting; recruiter-engagement event surface end-to-end | ✓ Good — production dashboard live, zero PII exposure |
| Anthropic `max_tokens` 768 → 1500 (v1.2 Phase 14 gap-closure) | UAT test 3 surfaced truncation; richer answers needed | ✓ Good — paired with `message_delta` truncation observability |
| TDD with Wave 0 RED stubs every v1.2 phase | Goal-backward verification; nyquist coverage upstream not retroactive | ✓ Good — applied Phases 13/14/15/16; all 5 phases NYQUIST-COMPLIANT |

## Constraints

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill — no ad-hoc design choices
- **Tech stack**: Astro 6 + Tailwind CSS v4 (GSAP removed in v1.1; native motion only in v1.2+)
- **Design system**: `design-system/MASTER.md` is the locked contract; `design-system/MOTION.md` is the additive motion carve-out from v1.2 Phase 16; six-hex palette; Geist + Geist Mono only
- **Chat**: Phase 7 architecture preserved (SSE streaming, focus trap, XSS sanitization, CORS, 5/60s rate limit, 30s timeout, localStorage persistence) — D-26 regression battery is a milestone-level gate for any phase touching `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`
- **Audience**: Must serve both 30-second recruiter scans and 10-minute engineer deep dives
- **Zero new runtime dependencies preferred path** — established in v1.2; honor in future phases unless justified at plan-time

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after v1.2 milestone close.*
