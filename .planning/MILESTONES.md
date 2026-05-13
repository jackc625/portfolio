# Milestones

## v1.3 Chat Visibility (Shipped: 2026-05-13)

**Phases completed:** 4 phases (17-20), 26 plans

**Stats:**

- 195 commits since `v1.2` tag (4 days, 2026-05-09 → 2026-05-13)
- 195 files changed repo-wide (+48,069 / −1,684 LOC); src/ alone 26 files (+2,239 / −152)
- Source LOC src/: ~4,715 → ~6,802 (+44%)
- `pnpm test` 560 PASS / 0 FAIL / 2 SKIP (Test Files 63 passed, 1 skipped); `pnpm exec astro check` 0/0/0 (116 files)
- `package.json dependencies` byte-identical phase-wide (MAIL-01 zero-new-runtime-dep lock held)
- Production deployment active at https://jackcutrara.com (Worker version `ede1431f-e92a-4fda-af54-4f8f57781d3b`); live email delivery confirmed (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`, Gmail Inbox arrival 2026-05-13T14:00:53Z)

**Key accomplishments:**

- Migrated Cloudflare Pages → Workers Static Assets — single Worker binding now serves the static site, `/api/chat`, and an hourly `scheduled()` cron from one deployment; custom domain `jackcutrara.com` reattached; preview URLs migrated to `*.workers.dev`; CI/CD switched to `wrangler deploy` via Workers Builds; D-15 SSE byte-identical anchor PRESERVED through cutover (Phase 17)
- DNS-verified + warmed Resend sending domain `mail.jackcutrara.com` — full 4-record family in Cloudflare DNS (SPF + DKIM 3x + MX feedback-smtp.us-east-1 + DMARC `p=none`); 5/5 warmup sends in Gmail Inbox first-try, ZERO Not-Spam feedback needed; Postmaster Tools enrolled (Phase 17 Plan 17-06)
- Closed all five v1.2 chat carry-forward debt items (DEBT-01..05) — PROJECT.md "Known issues" reframed; `chat.cache_metrics` server + DEV-only client log seams; CI `build:chat-context:check` step; idempotent `astro:page-load` listener dedup across 3 scripts; CSS-only `#chat-panel` state machine structurally enforced at BOTH specificity tiers (Phase 17 Plans 17-03..05 + Phase 17 Plan 17-08 inline-style closure)
- Wired KV persistence — every chat turn (visitor + assistant) appended to versioned `live:{sessionId}` transcripts keyed by client-minted UUIDv4 sessionId via `crypto.randomUUID()`; 30-day TTL; 30-turn cap; inline metadata `{ last_activity_at, msg_count }` eliminates O(n) cron round-trips; sessionId lives on HTTP envelope only (TEST-03 Anthropic prompt-cache integrity PRESERVED — live 3x cache test `cache_read=48527` on Calls 2+3) (Phase 18)
- Wired hourly cron sweep with two-keyspace promotion (`live:{sid}` → `delivered:{sid}`) — DRY_RUN gate validated full sweep mechanics before email went live; crash-safe ordering (PUT delivered → POST Resend → DELETE live); per-session try/catch isolation; 50-session batch cap; 50-page pagination cap; structured JSON logs per tick; cron tick observed firing within 15s of Phase 20 deploy (Phase 19)
- Wired Resend REST integration — pure `fetch()` wrapper to `https://api.resend.com/emails` with `Idempotency-Key: transcript/{sessionId}` 24h window; AbortController 10s timeout with `clearTimeout` in `finally`; 3-variant discriminated `Result` per D-17 (sent / failed_transient / failed_terminal); plaintext-only body with sanitizer pipeline that strips bidi overrides + null bytes + HTML-escapes every dynamic field; adversarial-payload suite covers `<script>` / `</p><img onerror=...>` / `javascript:` / RTL override / null bytes / social-engineering provenance; first real visitor-transcript email delivered to Jack's Gmail Inbox confirmed 2026-05-13 (Phase 20)
- Phase 17 UAT gap closure — all 4 UAT-GAP-* requirements closed in serial gap-closure waves (M-iter2 wave correction: 17-07 voice-split → 17-09 COPY button → 17-10 pageswap handler → 17-08 inline `display:none` removal as release-blocker deploy gate); DEPLOY-GATE.md operator-confirmed before `git push origin main`; `pnpm exec astro check` 0/0/0 for first time since Plan 17-03 (4-plan-deep listener-dedup typecheck carry-forward absorbed)

**Known deferred items at close:** 2 organic-evidence / operator items + 8 tracked operational/hygiene items

- **SC4 organic-traffic idempotency-in-the-wild closure** — pending 2026-05-20 (7-day soft cap from Phase 20 deploy); Layer 1 `delivered:{sid}` cursor + Layer 2 Resend Idempotency-Key 24h window already structurally unit-locked; first organic visitor session post-deploy closes SC4; soft-cap proxy path documented (`node scripts/resend-warmup.mjs`)
- **Phase 19 operator UAT** — 19-UAT.md Steps 1-5 (Cloudflare Dashboard Past Events screenshot + PROD KV seed-and-sweep) require dashboard access (forbidden to executor per D-12); CRON-01..04 closed-by-design at build/unit layer (32/32 PASS); cron is now ACTIVE in production per Phase 20 UAT Step 2 evidence (first per-minute cron tick observed within 15s)
- **Phase 17 review Warnings WR-01..05** — closed at v1.3 closeout via `/gsd-quick 260513-hqk` (5 atomic commits `de781dd`..`7b53502`)
- **Operational** — Pre-existing Resend DNS dust on `send.*` + root (no conflict with `mail.*` scope; low-priority `/gsd-quick` cleanup); KV probe key `live:00000000-...` 30-day TTL expires ~2026-06-10; Workers Builds branch preview KV-isolation (operator awareness only); WR-04 `pnpm dev:worker` 403 cliff under wrangler dev with prod-built bundle (out of phase scope)
- **Hygiene** — Cross-phase test fragility — `worker-scheduled-call-site.test.ts` Invariant F regex now passes via comment match after Phase 20 DRY_RUN flip; functional wiring unaffected; lock fidelity degraded (fix: broaden regex to accept `"0"` literal). Dashboard-only secrets — `CHAT_SENDER_EMAIL` + `CHAT_RECIPIENT_EMAIL` no in-repo `.dev.vars` fallback documented. Frontmatter attribution gaps — Phase 17 plans 17-07/08/09/10 + Phase 19 plans 19-01..04 omit `requirements-completed:` field (requirements still covered by VERIFICATION.md + traceability table).

**Archive:** [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md) | [milestones/v1.3-REQUIREMENTS.md](milestones/v1.3-REQUIREMENTS.md) | [milestones/v1.3-MILESTONE-AUDIT.md](milestones/v1.3-MILESTONE-AUDIT.md)

---

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
