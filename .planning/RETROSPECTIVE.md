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

## Milestone: v1.2 — Polish

**Shipped:** 2026-04-27
**Phases:** 5 (12-16) | **Plans:** 34 | **Tasks:** ~120

### What Was Built

- **Phase 12 — Tech Debt Sweep:** All 7 v1.1 audit items closed; zero `pnpm build` warnings; MobileMenu inert extends to `.chat-widget`; chat copy-button parity via `createCopyButton`; OG URLs verified production-correct across 5 routes; MASTER.md §2.4 token exceptions documented
- **Phase 13 — Content + Sync:** All 6 case studies real (600–900 words, Problem→Approach→Architecture→Tradeoffs→Outcome→Learnings); `Projects/*.md` as authoritative source-of-truth; idempotent `scripts/sync-projects.mjs`; CONTENT-SCHEMA + VOICE-GUIDE docs published
- **Phase 14 — Chat Knowledge Upgrade:** Build-time `portfolio-context.json` from MDX + About + Resume; Anthropic `cache_control: ephemeral`; tuned third-person persona; prompt-injection battery GREEN; max_tokens 768→1500 + `message_delta` truncation observability
- **Phase 15 — Analytics:** Umami Cloud + Cloudflare Web Analytics live in production; recruiter-engagement events end-to-end (resume download, chat open, outbound clicks, scroll depth, `chat_truncated`); cookie-free, no consent banner
- **Phase 16 — Motion Layer:** Cross-document `@view-transition` fade + IntersectionObserver scroll-reveal + WorkRow arrow translateX + chat bubble pulse + chat panel scale-in + typing-dot bounce + `.h1-section` word-stagger; reduced-motion contract held; zero new runtime deps; D-15 server byte-identical; D-26 117/117 GREEN

### What Worked

- **Wave 0 RED test stubs every phase:** Phases 13/14/15/16 all opened with a Wave 0 plan authoring failing tests for every requirement before any implementation — goal-backward verification baked in upstream, no retroactive Nyquist reconstruction this milestone (v1.1 lesson #4 applied correctly)
- **Cross-phase gates as named contracts (D-15, D-26):** Naming the chat-server byte-identical gate (D-15) and the Phase 7 chat regression battery (D-26) made every chat-touching plan explicit about what it had to honor — battery passed 117/117 across Phases 12, 14, 15, 16 without a single regression
- **Build-time context generation pattern:** `scripts/build-chat-context.mjs` consuming `Projects/*.md` directly tied Phase 13 (content) and Phase 14 (chat knowledge) cleanly — single source of truth, freshness, and Anthropic prompt caching all from the same pipeline
- **Per-primitive scoped reduce-overrides (D-14):** Phase 16 codified the rule that reduced-motion neutralizers live in the primitive's own `<style>` block, not global.css — confines motion contract to the primitive boundary; WorkRow stayed scoped, chat-bubble fell back to global only because `#chat-bubble` has no scoped-island
- **Phase 15-as-baseline-before-Phase-16-motion:** Sequencing analytics before motion meant Phase 16's impact was measurable against a real content + chat baseline, not a guess
- **Production-on-Cloudflare-edge canonical-gate precedent:** Phase 15 §9 established that localhost simulated-throttled-4G LCP/FCP is an upstream Lighthouse artifact, not a real regression — Phase 16 inherited the precedent so motion-specific TBT=0 / CLS≈0 PASS held the bar without re-litigating
- **Comment-prose drift-guard pattern:** Applied 5 times across plans 15-02 / 16-02 / 16-04 / 16-05 / 16-06 — when grep-acceptance counts depend on literal substrings, the prose around the code gets reworded explicitly to avoid false positives. Caught real drift in `WorkRow.astro` JSDoc that contradicted the new MOTN-03 behavior
- **Gap-closure plans (14-07):** When UAT surfaced max_tokens truncation, raising 768→1500 and adding `message_delta` observability landed as a discrete 14-07 plan instead of a sprawl back into 14-03 — atomic, traceable, didn't reopen closed plans
- **3-source cross-reference verification at audit time:** v1.2-MILESTONE-AUDIT.md cross-checked VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md for every requirement — caught 8 stale checkboxes (CONT-01..07 + CHAT-06) where the work was shipped but the tracking artifact lagged. Worth the time

### What Was Inefficient

- **REQUIREMENTS.md checkbox-tier vs traceability-tier drift (CONT-01..07 + CHAT-06):** Phase 13 closed 9/9 plans with VERIFICATION.md `status: passed` and 7/7 requirements satisfied per SUMMARY frontmatter, but the seven `- [ ] CONT-XX` checkboxes at REQUIREMENTS.md:26-32 and the seven traceability rows at lines 99-105 were never flipped. Acknowledged in REQUIREMENTS.md:130 footer ("CONT 0/7 — tracked outside Phase 16 scope") but a tell that requirement-tier mutation is not happening as part of plan close-out. CHAT-06 same pattern. Cleanup applied at v1.2 milestone close
- **ROADMAP.md Progress table row drift:** Phase 13 row line 198 stayed "7/9 plans / In progress / -" even after VERIFICATION.md and all 9 plans closed — same artifact-update gap as the REQUIREMENTS.md checkboxes, different file. Cleanup applied at milestone close
- **Cross-phase concern surfaced late (`build:chat-context:check` not in CI):** Phase 14 added the `build:chat-context:check` script for `Projects/*.md` ↔ `portfolio-context.json` drift but never wired it as a CI gate. Caught at milestone-audit cross-phase integration check, not at Phase 14 close-out. WARNING-severity, not blocking, but the kind of thing that should land in the same plan that introduces the script
- **Lighthouse Performance ≥99 localhost gate compromise:** Accepted localhost 80/81 against the ≥99 target by inheriting Phase 15 §9 precedent. The precedent is correct (production-on-Cloudflare-edge is canonical), but the planning artifact ROADMAP.md still publishes ≥99 as the Phase 16 success criterion verbatim. Either lower the localhost gate explicitly in ROADMAP.md success criteria, or split the gate into "production canonical" vs "localhost stress-test" as separate measurable targets
- **`#chat-panel` JS-coupled display contract (MOTN-05):** `animatePanelOpen` flips `style.display="flex"` directly while `.is-open` only animates — the contract is implicit (CSS doesn't override display). Works today, but a future plan that changes display handling could break the animation invisibly. Should have been explicit in MOTION.md or a dedicated decision row
- **Pre-existing carry-forward items (rate-limiter binding, OG default image, mobile menu breakpoint) crossed two milestones now:** v1.1 audit deferred → v1.2 audit deferred → still pending. Pattern suggests the backlog promotion step at milestone start isn't catching them, or they're correctly low-priority but the inventory should be reviewed at start-of-milestone, not end

### Patterns Established

- **D-15 server byte-identical gate:** Named the contract that any phase touching client-chat surface (`chat.ts`, `BaseLayout.astro`, `global.css`) must keep `src/pages/api/chat.ts` byte-identical — Phase 15 + 16 both reported `git diff vs phase-start = 0 lines`. Pattern: name the gate, measure it as `git diff | wc -l`, fail-fast if non-zero
- **D-26 chat regression battery as universal post-touch gate:** Any phase touching the chat surface runs the full Phase 7 invariant battery (XSS / CORS / rate-limit / 30s timeout / focus-trap / persistence / SSE / markdown / clipboard) before merge. Phase 14 ran 9/9 (incl. 6 automated + 2 manual preview + 1 documented binding gap); Phase 16 ran 117/117 across 8 test files
- **Per-primitive scoped reduce-overrides (D-14):** Reduced-motion neutralizers live inside the primitive's own scoped `<style>` block when the primitive has a scoped-island; fall back to global.css only when the selector targets a non-scoped surface (`#chat-bubble`)
- **Wave-based plan dependency graph in ROADMAP.md:** Phase 16 broke 7 plans into 4 waves with explicit "blocked on Wave N" annotations, enabling 16-02 ‖ 16-03 and 16-05 ‖ 16-06 parallelism. Pattern scales to multi-plan phases without orchestration confusion
- **Cross-phase gates section in REQUIREMENTS.md:** v1.2 REQUIREMENTS.md introduced a Cross-Phase Constraints section listing milestone-wide gates (D-26, Lighthouse CI, zero new deps, reduced-motion contract, no subtractive MASTER.md). Visible in every plan that touches the listed surfaces — pattern reduces "I forgot the chat regression gate" failure mode
- **Source-of-truth `.md` + sync-pipeline → `.mdx` body for case studies:** `Projects/*.md` (authored) → `scripts/sync-projects.mjs` → `src/content/projects/*.mdx` (body only; frontmatter human-authored) gated by Zod via `astro check`. Generalizable to any single-source-of-truth content workflow
- **Comment-prose drift-guard:** When acceptance criteria depend on literal-substring grep counts, plan-author rewrites comment prose to avoid false positives. Applied 5× this milestone — should be canonical for any plan that uses grep counts as gates
- **Gap-closure plans as discrete additions, not retroactive plan reopens:** UAT surfaced max_tokens truncation → 14-07 plan added (don't reopen 14-03). Keeps plan history append-only and traceable
- **Audit-tier vs requirement-tier checkbox drift detection at milestone close:** Cross-reference VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md checkboxes with a 3-source comparison. Catches stale `[ ]` boxes where the work shipped but the artifact lagged

### Key Lessons

1. **Name your cross-phase gates** — D-15 (server byte-identical), D-26 (chat regression battery) made the implicit contracts explicit, traceable, and grep-able. Untouched contracts decay quietly; named contracts get measured every plan
2. **Wave 0 RED stubs are the correct nyquist insertion point** — authoring failing tests for every requirement before any implementation eliminates retroactive VALIDATION.md reconstruction (v1.1 lesson #4 verified working)
3. **Sequencing matters: stable foundation → instrumented baseline → bold change** — v1.2 went tech debt (12) → real content (13) → smarter chat (14) → analytics baseline (15) → motion (16). Putting analytics before motion meant Phase 16's impact was measurable, not guessed
4. **Per-primitive scoped overrides over global.css** when the primitive has a scoped-island — confines the contract to the primitive boundary, prevents future global.css edits from breaking primitive behavior
5. **Localhost vs production Lighthouse gates need to be split explicitly** — accepting localhost 80/81 against a ≥99 target is correct but tracking it as a verbatim success criterion creates a precedent-of-precedents. Better: write the gate with two thresholds (production canonical + localhost stress-test acceptable range) directly in ROADMAP.md success criteria
6. **Requirement-tier checkbox mutation must be part of plan close-out, not deferred to milestone close** — every plan that closes a requirement should flip its `[ ]` checkbox + traceability row in the same atomic commit. CONT-01..07 + CHAT-06 drift this milestone is the second time we've seen this pattern (v1.1 had a milder version)
7. **Cross-phase concerns belong in the introducing plan, not at milestone audit** — `build:chat-context:check` script without CI enforcement was caught by audit, not by Phase 14 close-out. If a plan adds a script that's meant to gate something, the gate-wiring is part of the same plan
8. **Pre-existing carry-forward items need a backlog promotion checkpoint at milestone START, not end** — rate-limiter binding, OG default image, mobile menu breakpoint all crossed two milestones. Promote-or-explicitly-defer at `/gsd-new-milestone`, not at `/gsd-complete-milestone`

### Cost Observations

- Model mix: Primarily opus for execution + plan authoring + research, sonnet for verification agents and lighter doc tasks
- Sessions: ~20+ across 12 days (2026-04-15 → 2026-04-27)
- Notable: Phase 13 (9 plans, batched case-study authoring) and Phase 16 (7 plans across 4 waves) were the highest-touch phases. Phase 12 (6 plans, all tech-debt) was the cheapest per-plan due to small surface and clear closure criteria

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~10 | 6 | 27 | Established GSD workflow, design reference pattern |
| v1.1 | ~15 | 4 | 27 | Added phased rebuild shape (Foundation→Primitives→Pages→Polish) and design-contract-first discipline |
| v1.2 | ~20+ | 5 | 34 | Added Wave 0 RED stubs every phase, named cross-phase gates (D-15/D-26), wave-based plan dependency graphs, source-of-truth → sync-pipeline content workflow |

### Top Lessons (Verified Across Milestones)

1. Always provide a visual design reference — blind AI design iterations waste time (v1.0 + v1.1)
2. Milestone-level audit catches cross-phase gaps that per-phase verification misses (v1.0 + v1.1 + v1.2 — caught 8 stale checkboxes + 1 CI-enforcement gap this milestone)
3. Write the design contract before writing code — MASTER.md-as-task-1 eliminates per-phase drift (v1.1) — generalized in v1.2 to: write the gate contracts (D-15, D-26) before plans that touch the gated surface
4. Phase rebuilds as foundation → primitives → pages → polish (v1.1) — generalized in v1.2 to: stable foundation → instrumented baseline → bold change
5. Wave 0 RED stubs as the nyquist insertion point (v1.2, new) — authoring failing tests for every requirement upstream eliminates retroactive VALIDATION.md reconstruction
6. Requirement-tier checkbox mutation must be part of plan close-out, not deferred (v1.1 mild + v1.2 strong) — every plan flipping `[ ]` → `[x]` + traceability row in the same atomic commit
7. Pre-existing carry-forward items need backlog promotion at milestone START (v1.2, new) — items deferred at audit cross multiple milestones quietly
