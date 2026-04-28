# Milestones

## v1.2 Polish (Shipped: 2026-04-27)

**Phases completed:** 5 phases (12-16), 34 plans

**Stats:**

- 213 commits since `v1.1` tag (12 days, 2026-04-15 → 2026-04-27)
- 132 code/config files changed (+5946 / -470 LOC)
- Source LOC: ~3,859 → ~4,715 (src/)
- Lighthouse motion-specific gate PASS: TBT=0ms / CLS≈0.0016
- D-26 chat regression battery: 117/117 GREEN (8 test files); D-15 server byte-identical phase-wide; zero new runtime dependencies

**Key accomplishments:**

- All 7 v1.1 audit carry-forward items closed in Phase 12 — zero `pnpm build` warnings, MobileMenu inert extends to `.chat-widget`, chat copy-button parity via `createCopyButton`, OG URLs verified production-correct across 5 routes, MASTER.md §2.4 token exceptions documented
- All 6 project pages now ship real 600–900 word case studies (Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings) with `Projects/*.md` as authoritative source-of-truth and an idempotent `scripts/sync-projects.mjs` pipeline gated by Zod via `astro check`
- Chat widget upgraded with build-time `portfolio-context.json` (Anthropic `cache_control: ephemeral`), tuned third-person persona, prompt-injection test battery, `max_tokens` 768 → 1500 + `message_delta` truncation observability — all while D-26 regression battery stays GREEN
- Privacy-respecting analytics live in production — Umami Cloud (cookie-free) + Cloudflare Web Analytics measuring resume download, chat open, outbound clicks, project scroll depth, and `chat_truncated` with no consent banner required
- Tasteful motion layer shipped — cross-document `@view-transition` fade, IntersectionObserver scroll-reveal, WorkRow arrow translateX, chat bubble pulse, chat panel scale-in, typing-dot bounce, `.h1-section` word-stagger — every animation gated by `(prefers-reduced-motion: no-preference)` or paired `reduce` override; `design-system/MOTION.md` authored as additive carve-out without touching MASTER.md §8 anti-patterns
- Zero new runtime dependencies, D-15 server byte-identical, manual UAT 13/13 PASS approved by Jack 2026-04-27 (`16-VERIFICATION.md`)

**Known deferred items at close:** 8 (3 cross-phase: CHAT_RATE_LIMITER binding, chat cache-hit-rate observability, `build:chat-context:check` CI enforcement; 3 hygiene: WR-01 listener dedup, `#chat-panel` JS-coupled display contract, ANAL-02 preview-subdomain silence check; 2 pre-existing pending todos: mobile menu breakpoint, OG default image)

**Archive:** [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) | [milestones/v1.2-REQUIREMENTS.md](milestones/v1.2-REQUIREMENTS.md) | [milestones/v1.2-MILESTONE-AUDIT.md](milestones/v1.2-MILESTONE-AUDIT.md)

---

## v1.1 Editorial Redesign (Shipped: 2026-04-15)

**Phases completed:** 4 phases, 27 plans, 63 tasks

**Key accomplishments:**

- Locked editorial design system captured in `design-system/MASTER.md` — 6-hex palette, Geist + Geist Mono typography via Astro 6 Fonts API (self-hosted), restrained-motion rules
- Killed the v1.0 visual system: dark mode, theme toggle, GSAP, canvas hero, view transitions, project card grid, and the standalone /resume route all removed
- Rebuilt the component library in `src/components/primitives/` — Container, SectionHeader, WorkRow, MetaLabel, StatusDot, Header, Footer, MobileMenu (container-query hamburger, focus-trap dialog)
- Rewrote every visible page (home, about, projects, project detail, contact) as editorial compositions with real content from the existing content collection
- Restyled chat widget to editorial chrome (flat-rectangle, mono labels) and restored cross-page persistence via localStorage (50-message cap, 24h TTL) while preserving all Phase 7 security/streaming/a11y guarantees
- Shipped Lighthouse Performance 100 / Accessibility 95 / Best Practices 100 / SEO 100 with WCAG AA contrast verified and full keyboard focus rings; merged to main and deployed to Cloudflare Pages

---

## v1.0 MVP (Shipped: 2026-04-01)

**Phases completed:** 6 phases, 27 plans, 43 tasks

**Key accomplishments:**

- Astro 6 + Tailwind CSS v4 + TypeScript foundation with OKLCH design tokens and content collection schemas
- Responsive site shell with sticky nav, mobile menu, SEO meta, and full keyboard accessibility
- Full visual rebuild cloning shiyunlu.com's design language with generative canvas hero (simplex noise)
- Project card grid + structured MDX case studies with 2 fully written pieces
- Dark/light theme system, GSAP scroll animations, page transitions, JSON-LD structured data
- Lighthouse 90+ on all pages, production deploy on Cloudflare Pages (jackcutrara.com)

---
