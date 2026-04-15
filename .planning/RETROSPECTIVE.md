# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-31
**Phases:** 6 | **Plans:** 27 | **Tasks:** 43

### What Was Built
- Complete portfolio website (Home, About, Projects, Resume, Contact) with generative canvas hero
- Design system with OKLCH tokens, dark/light themes, Inter + IBM Plex Mono typography
- Project system with content collections, card grid, and structured MDX case studies
- GSAP scroll animations, page transitions, hover micro-interactions with reduced-motion support
- JSON-LD structured data, SEO meta infrastructure, print stylesheet
- Production deployment on Cloudflare Pages (jackcutrara.com) with CI/CD

### What Worked
- **Research-driven stack selection**: Astro 6 + Tailwind v4 delivered zero-JS pages and Lighthouse 90+ without optimization heroics
- **Content collections with Zod schemas**: Type-safe project content with build-time validation caught errors early
- **Design reference (shiyunlu.com)**: Having a specific visual target eliminated the "generic AI portfolio" problem
- **Phase-based execution**: 6 clear phases with dependency chains kept scope controlled
- **GSAP dynamic imports**: Code-splitting via dynamic import() kept Performance scores high without manual chunk config
- **Milestone audit before completion**: Caught 6 tech debt items and verified all 45 requirements

### What Was Inefficient
- **Multiple failed design attempts (Phase 3)**: Plans 03-05 and 03-06 produced generic layouts repeatedly — Claude cannot visually verify its own output, leading to multiple rejected iterations before adopting the shiyunlu.com reference approach
- **Canvas hero mouse influence bug**: Required 3 attempts across 2 plans (05-05, 05-06) to fix a mathematically broken formula — the section overlay z-index issue masked the real bug
- **GSAP + View Transitions lifecycle**: Reinitializing animations on `astro:page-load` and cleaning up on `astro:before-preparation` required trial and error to get right
- **Worktree gitlinks leak**: Git worktree artifacts leaked into commits, requiring a cleanup commit

### Patterns Established
- `data-animate` attribute convention for separating animation concerns from styling
- `.theme-transitioning` class pattern for scoped theme transition CSS
- `astro:after-swap` (not `astro:page-load`) for theme restoration during View Transitions
- Asymmetric grid layout (mono label + content) as inner page pattern
- CSS `opacity:0` pre-animation state with 3s JS fallback for Safari protection
- Tiered canvas particles (200/600/1000 by breakpoint)

### Key Lessons
1. **Claude cannot design blind** — without a visual reference or user mockup, AI generates structurally identical layouts with different CSS. Always provide a design reference for visual work.
2. **Dynamic imports are the GSAP performance answer** — Vite's code-splitting handles chunk boundaries automatically; no manual `manualChunks` config needed.
3. **View Transitions require explicit lifecycle management** — every client-side script that manipulates DOM must reinitialize on `astro:page-load` and clean up on `astro:before-preparation`.
4. **OKLCH tokens + CSS vars = painless theming** — defining tokens once in `:root` (dark) and `[data-theme='light']` with `@theme` bridge made both themes work everywhere automatically.
5. **Milestone audit catches what phase-level verification misses** — cross-phase integration gaps (like orphaned components and dormant infra) only surface when checking the full picture.

### Cost Observations
- Model mix: Primarily opus for execution, sonnet for research agents
- Sessions: ~10 across 10 days
- Notable: 27 plans averaging ~4 minutes each; Phase 5 (animations) and Phase 6 (performance) took the most time due to debugging and manual verification

---

## Milestone: v1.1 — Editorial Redesign

**Shipped:** 2026-04-15
**Phases:** 4 | **Plans:** 27 | **Tasks:** 63

### What Was Built
- `design-system/MASTER.md` — locked editorial contract (tokens, typography, layout, motion, accent rules, anti-patterns) written before any code changes
- Flat 6-hex palette replacing OKLCH tokens; Geist + Geist Mono self-hosted via Astro 6 Fonts API; GSAP/dark mode/canvas hero/view transitions fully removed
- New primitive library in `src/components/primitives/` — Container, SectionHeader, WorkRow, MetaLabel, StatusDot, Header, Footer, MobileMenu (container-query hamburger, focus-trap dialog)
- Full page port: homepage (display hero + numbered work list + about preview + contact), about (3 paragraphs), projects index, project detail (editorial case study), contact (minimal)
- Chat widget restyle (flat-rectangle chrome, mono labels) with localStorage persistence restored (50-msg cap, 24h TTL)
- Lighthouse 100/95/100/100, WCAG AA verified, deployed to Cloudflare Pages

### What Worked
- **MASTER.md as task 1 of Phase 8**: Writing the design contract before any code changes eliminated drift — every subsequent phase consumed it as the rules artifact
- **Foundation → Primitives → Page Port → Polish phase shape**: Building the component library before rewriting pages prevented the page-by-page churn that would happen from porting and designing simultaneously
- **mockup.html as visual reference through Phases 8-10**: Preserving the static HTML reference gave Claude a target to match instead of re-designing blind (v1.0 lesson applied correctly)
- **Integration-point deviation restraint**: Plan 09-05 swapped the primitive library into BaseLayout.astro by touching exactly 4 lines — minimum viable integration = minimum regression surface
- **Phase 7 chat as universal regression gate**: Every phase touching BaseLayout or shared CSS had to smoke-test the chat widget before shipping — caught issues before they compounded
- **Cross-AI review before executing Phase 11**: Gemini + Codex review surfaced contrast-truth and merge-safety concerns that tightened the plans

### What Was Inefficient
- **Phase 9 retroactive VALIDATION.md reconstruction (State B)**: 22 validation gaps were reclassified manual-only after the fact — sign that Nyquist classification wasn't happening during plan authoring
- **Lightning-css warnings from Tailwind v4 Oxide template detection**: 4 `Unexpected token Delim('*')` warnings from literal `var(--token-*)` example strings in `.planning/` surfaced in Phase 9 and weren't closed until Phase 11 via `@source not` directive — deferred-items discipline slipped one phase
- **Live vs replayed chat copy button code drift**: `chat.ts:302` uses SVG icon, `chat.ts:555` uses `COPY` text for the same UI — a 2-line fix that accumulated because live and replay paths diverged across plans 10-05 and 10-06
- **STATE.md field drift**: `gsd-tools milestone complete` warned that the `Last Activity Description` field was missing — STATE.md's shape has drifted from what the tool expects

### Patterns Established
- **Primitive-in-primitive composition**: `StatusDot` composes `MetaLabel` — pattern adopted by composite primitives (Header/Footer/WorkRow)
- **Dynamic tag prop `{ as: Tag = 'div' }` rename**: Astro requires capital-letter identifier for dynamic tag rendering while MASTER.md locks lowercase `as` prop name
- **Scoped CSS variant classes** (e.g., `.meta-label--ink-muted`): Astro auto-scopes class names, keeps runtime zero-JS, confines color-switching to the six-token palette
- **Container query hamburger**: `@container (max-width: 380px)` on `header-inner` is the true signal — mobile nav appears when nav would actually wrap, not at arbitrary viewport breakpoint
- **Belt-and-suspenders dev route indexing defense**: sitemap filter + robots.txt Disallow + per-page noindex meta — triple defense required because astro-seo's default index,follow conflicts with slot-injected noindex
- **Opacity-only hover transitions**: WorkRow + NextProject use `opacity 0→1, 120ms ease` with zero transform — restraint primitive for the "no motion" design system

### Key Lessons
1. **Write the design contract as task 1, not as an afterthought** — MASTER.md before any code changes eliminated the per-phase design drift that plagued v1.0
2. **Phase the rebuild as foundation → primitives → pages → polish** — trying to redesign and port pages simultaneously is a recipe for rework; build the component library first even though it looks like a phase without user-facing output
3. **Minimum viable integration = minimum regression surface** — when swapping a primitive library into a shared shell, touch only the import paths; don't also refactor the shell
4. **Classify Nyquist manual-only at plan-authoring time, not retroactively** — State B reconstruction for 22 gaps across Phases 9-10 is a tell that the decision belongs upstream in the plan
5. **Defer lightning-css / build warnings the same phase they appear** — deferring across phases lets them compound; `deferred-items.md` worked as a ledger but the fix should have landed in Phase 9, not Phase 11

### Cost Observations
- Model mix: Primarily opus for execution + plan authoring, sonnet for research and verification agents
- Sessions: ~15 across 9 days (2026-04-07 → 2026-04-15)
- Notable: Phase 11 was the most expensive phase (cross-AI review + Lighthouse audit + WCAG inventory + merge + deploy + closeout all in 3 plans)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~10 | 6 | 27 | Established GSD workflow, design reference pattern |
| v1.1 | ~15 | 4 | 27 | Added phased rebuild shape (Foundation→Primitives→Pages→Polish) and design-contract-first discipline |

### Top Lessons (Verified Across Milestones)

1. Always provide a visual design reference — blind AI design iterations waste time (v1.0 + v1.1)
2. Dynamic imports solve GSAP bundle size without manual chunk config (v1.0) — moot after v1.1 removed GSAP entirely
3. Milestone-level audit catches cross-phase gaps that per-phase verification misses (v1.0 + v1.1)
4. Write the design contract before writing code — MASTER.md-as-task-1 eliminates per-phase drift (v1.1, new)
5. Phase rebuilds as foundation → primitives → pages → polish — don't design and port simultaneously (v1.1, new)
