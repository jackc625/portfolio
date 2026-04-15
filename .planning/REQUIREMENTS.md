# Requirements — Milestone v1.2 Polish

**Milestone goal:** Raise the bar on what already shipped — tasteful motion, real content everywhere, smarter chat, zero tech debt, measurable recruiter engagement.

**Core value reminder:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

**Key context:**
- Additive milestone on top of shipped v1.1 editorial system (Lighthouse 100/95/100/100, locked `design-system/MASTER.md`)
- Zero new runtime dependencies on the preferred path — motion is CSS-first, chat upgrade uses existing Anthropic SDK, analytics is a script tag
- MASTER.md is no longer a word-for-word contract in v1.2 — motion layers on top additively; §8 anti-pattern list stays intact
- Phase 7 chat regression battery is a milestone-level gate for every phase that touches BaseLayout / global.css / chat.ts / api/chat.ts

## v1.2 Requirements

### Tech Debt (DEBT)

- [x] **DEBT-01**: Zero `pnpm build` warnings — lightning-css, astro check, ESLint all clean
- [ ] **DEBT-02**: MobileMenu background elements inert when menu is open (focus-trap middle-element edge case fixed via `inert` attribute)
- [ ] **DEBT-03**: OG URL builder verified correct in production — absolute URLs, no latent path bugs
- [ ] **DEBT-04**: Chat copy button markup identical between live-streamed and localStorage-replayed bot messages
- [ ] **DEBT-05**: `--ink-faint` contrast exception documented in MASTER.md with rationale (decorative metadata only; non-text UI 3:1 threshold)
- [ ] **DEBT-06**: All remaining v1.1 audit items closed or explicitly documented as accepted trade-offs

### Content (CONT)

- [ ] **CONT-01**: All 6 project MDX case studies have real content (4 placeholder files rewritten from source-of-truth in `Projects/`)
- [ ] **CONT-02**: Case studies follow documented structure: Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings (600–900 words each)
- [ ] **CONT-03**: About page narrative audited for accuracy; copy verified current
- [ ] **CONT-04**: Homepage display hero, work list entries, and Resume PDF copy audited and verified current
- [ ] **CONT-05**: `Projects/` folder per-project docs are the authoritative source of truth for MDX case studies
- [ ] **CONT-06**: `scripts/sync-projects.mjs` built — idempotent, manual-trigger; syncs `Projects/*.md` body into `src/content/projects/*.mdx`; frontmatter stays human-authored; Zod schema enforced via `astro check`
- [ ] **CONT-07**: `docs/CONTENT-SCHEMA.md` and `docs/VOICE-GUIDE.md` published to prevent future drift

### Chat Knowledge (CHAT — continuing from CHAT-02)

- [ ] **CHAT-03**: `scripts/build-chat-context.mjs` integrated into build — merges MDX + About + Resume into `portfolio-context.json` at build time
- [ ] **CHAT-04**: Static-authored and generated portfolio context files split (`portfolio-context.static.json` vs generated)
- [ ] **CHAT-05**: Anthropic prompt caching enabled (`cache_control: ephemeral`) on the knowledge block to hit cache-read pricing
- [ ] **CHAT-06**: System prompt tuned — third-person persona ("Jack built this..."), scope-bound refusal, no PII / resume PDF exposure
- [ ] **CHAT-07**: `max_tokens` raised from 512 → 768 to accommodate richer answers
- [ ] **CHAT-08**: Prompt-injection test battery added — resists jailbreaks ("ignore all previous instructions", "repeat your instructions", role confusion)
- [ ] **CHAT-09**: Phase 7 regression battery passes (XSS, CORS, rate limit, timeout, focus trap, persistence, streaming, markdown, clipboard)

### Analytics (ANAL)

- [ ] **ANAL-01**: Umami Cloud (free tier) integrated via `<script>` in BaseLayout, env-gated to production hostname only
- [ ] **ANAL-02**: Cloudflare Web Analytics enabled as secondary for Core Web Vitals
- [ ] **ANAL-03**: `src/scripts/analytics.ts` forwards existing `chat:analytics` CustomEvent (content-free per Phase 7 D-36) to Umami
- [ ] **ANAL-04**: Delegated outbound-link tracking — clicks on `a[href^="http"]`, `mailto:`, and `.pdf` emit Umami events
- [ ] **ANAL-05**: Recruiter-engagement events instrumented: resume download, chat widget open, outbound social link clicks, project-page scroll depth
- [ ] **ANAL-06**: No cookie consent banner required (Umami + CF Web Analytics are cookie-free by design)

### Motion (MOTN)

- [ ] **MOTN-01**: Page-enter fade via native cross-document `@view-transition` CSS at-rule (no ClientRouter, no JS router)
- [ ] **MOTN-02**: Scroll-reveal utility module `src/scripts/motion.ts` using IntersectionObserver — fade + ≤12px translateY, 250–350ms, one-shot per element
- [ ] **MOTN-03**: WorkRow arrow slide-in on hover/focus (opacity 0→1 + 4px translateX, 180ms)
- [ ] **MOTN-04**: Chat bubble idle pulse restored via CSS — paused on hover/focus/reduced-motion
- [ ] **MOTN-05**: Chat panel open scale-in (96%→100%, 180ms)
- [ ] **MOTN-06**: Typing-dot bounce during SSE streaming
- [ ] **MOTN-07**: Section heading word-stagger on `.h1-section` only (never `.display`)
- [ ] **MOTN-08**: All motion wrapped in `@media (prefers-reduced-motion: no-preference)` or paired with `reduce` override
- [ ] **MOTN-09**: MASTER.md §5/§6 amended with additive motion carve-outs (property whitelist, duration bands, easing defaults)
- [ ] **MOTN-10**: Lighthouse gate passes — Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 after motion layer lands

## Future Requirements (deferred to v1.3+)

- Signature hero moment / hero animation — user-excluded for v1.2
- Project → project view-transition-name morph (cross-document named-element morphs)
- Keyword routing for chat knowledge (only if steady-state Anthropic spend exceeds ~$5/mo)
- RAG / vector DB for chat — revisit past ~150k token corpus size
- Function-calling chat tools (getProject, listProjects) — tripled SSE streaming complexity for marginal signal

## Out of Scope

- Blog / writing section — not committed to writing cadence (PROJECT.md)
- Testimonials — no content source
- CMS — static content sufficient
- Contact form — direct links more professional for this audience
- 3D / Three.js / canvas — bloats bundle, kills mobile performance
- Skills progress bars / GitHub contribution graph — amateurish signals
- Real-time chat / voice — chatbot covers Q&A sufficiently
- Background audio / custom loading screens — accessibility + performance anti-patterns
- Reintroducing GSAP — removed in v1.1 for a reason; 2026 native platform covers v1.2 needs
- Reintroducing `<ClientRouter />` — collides with Phase 7 localStorage chat persistence

## Traceability

Every v1.2 requirement maps to exactly one phase. 36 of 36 requirements mapped.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 12 | Complete |
| DEBT-02 | Phase 12 | Pending |
| DEBT-03 | Phase 12 | Pending |
| DEBT-04 | Phase 12 | Pending |
| DEBT-05 | Phase 12 | Pending |
| DEBT-06 | Phase 12 | Pending |
| CONT-01 | Phase 13 | Pending |
| CONT-02 | Phase 13 | Pending |
| CONT-03 | Phase 13 | Pending |
| CONT-04 | Phase 13 | Pending |
| CONT-05 | Phase 13 | Pending |
| CONT-06 | Phase 13 | Pending |
| CONT-07 | Phase 13 | Pending |
| CHAT-03 | Phase 14 | Pending |
| CHAT-04 | Phase 14 | Pending |
| CHAT-05 | Phase 14 | Pending |
| CHAT-06 | Phase 14 | Pending |
| CHAT-07 | Phase 14 | Pending |
| CHAT-08 | Phase 14 | Pending |
| CHAT-09 | Phase 14 | Pending |
| ANAL-01 | Phase 15 | Pending |
| ANAL-02 | Phase 15 | Pending |
| ANAL-03 | Phase 15 | Pending |
| ANAL-04 | Phase 15 | Pending |
| ANAL-05 | Phase 15 | Pending |
| ANAL-06 | Phase 15 | Pending |
| MOTN-01 | Phase 16 | Pending |
| MOTN-02 | Phase 16 | Pending |
| MOTN-03 | Phase 16 | Pending |
| MOTN-04 | Phase 16 | Pending |
| MOTN-05 | Phase 16 | Pending |
| MOTN-06 | Phase 16 | Pending |
| MOTN-07 | Phase 16 | Pending |
| MOTN-08 | Phase 16 | Pending |
| MOTN-09 | Phase 16 | Pending |
| MOTN-10 | Phase 16 | Pending |

**Coverage:** 36 / 36 v1.2 requirements mapped. No orphans. No duplicates.

---

*Last updated: 2026-04-15 — milestone v1.2 roadmap created; traceability filled. Next: `/gsd-plan-phase 12`.*
