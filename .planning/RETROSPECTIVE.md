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

## Milestone: v1.3 — Chat Visibility

**Shipped:** 2026-05-13
**Phases:** 4 (17-20) | **Plans:** 26 | **Commits:** 195 over 4 days

### What Was Built

- **Phase 17 — Foundations + Migration + DNS + Debt Sweep:** Cloudflare Pages → Workers Static Assets migration with single binding for static + `/api/chat` + `scheduled()` cron; `mail.jackcutrara.com` DNS-verified + warmed on Resend; all 5 v1.2 chat carry-forward debt items closed (DEBT-01..05); 4 UAT gap-closure plans (UAT-GAP-01..04) closed in serial waves; DEPLOY-GATE.md operator-confirmed
- **Phase 18 — Persistence + Identity:** `CHAT_KV` namespace bound; client-minted UUIDv4 sessionId via `crypto.randomUUID()`; per-turn append to versioned `live:{sid}` transcripts (30-day TTL, 30-turn cap, inline metadata `{ last_activity_at, msg_count }`); per-sessionId 100-writes/hr quota; sessionId on HTTP envelope only — TEST-03 prompt-cache integrity PRESERVED (live `cache_read=48527` on Calls 2+3)
- **Phase 19 — Cron Sweep (DRY_RUN):** Hourly cron `["0 * * * *"]` wired; `scheduled()` delegates to `deliverDue` via rejection-safe `ctx.waitUntil(...).catch(...)`; two-keyspace promotion (`live:` → `delivered:`) with PUT-before-POST crash-safe ordering; per-session try/catch isolation; 50-session batch cap; 50-page pagination cap; DRY_RUN gate validated mechanics before delivery
- **Phase 20 — Email Render + Resend:** Pure renderer `src/lib/email/render.ts` (4-stage sanitizer pipeline, 46 tests incl. 11 adversarial); pure REST wrapper `src/lib/email/resend.ts` (AbortController 10s, Idempotency-Key 24h, 3-variant discriminated `Result` per D-17); `wrangler.jsonc DRY_RUN "1"` → `"0"` atomic flip with D-03 rollback runway preserved byte-identical in source; first live transcript email delivered to Jack's Gmail Inbox confirmed (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`)

### What Worked

- **D-03 rollback runway preserved BYTE-IDENTICAL in source:** Phase 20's atomic DRY_RUN flip kept the entire DRY_RUN=='1' branch in `src/lib/chat-delivery.ts sendOne` alive as a single-line rollback target. Build guard `chat-delivery-send-site.test.ts` Invariants D + E source-text-lock the runway's presence. The flip is a one-line revert at any moment without code churn — pattern worth keeping
- **Three-layer idempotency defense (D-17 → Layer 1 `delivered:{sid}` cursor → Layer 2 Resend Idempotency-Key 24h):** Removing the `replayed` variant from `ResendResult` per D-17 forced the question "what IS the application-side replay detector?" — answer: the `delivered:{sid}` cursor (Layer 1) in Phase 19, with Resend's 24h `Idempotency-Key` window as Layer 2. Both layers structurally unit-locked. Result: SC4 organic-traffic closure has structural confidence even without organic evidence yet
- **Audit at every milestone close:** v1.3-MILESTONE-AUDIT.md surfaced 4/4 wiring chains WIRED, 8 tracked tech debt items, 1 partial requirement (FOUND-03 — operator-only), 1 deferred flow (SC4). The audit's explicit "milestone CAN be completed via /gsd-complete-milestone v1.3 (accepting deferred items)" gave permission to ship without inserting closure phases
- **DEPLOY-GATE.md template mirrored across phases (17-08 → 20-04):** Once Phase 17 Plan 17-08 established the 5-section operator-signed gate template, Phase 20 Plan 20-04 reused it. Pattern: human-only deploy gates get a single artifact (DEPLOY-GATE.md) with status=pending → status=confirmed by named operator + date + chat-reply audit trail
- **M-iter2 serial gap-closure wave correction (Plan 17-07 → 17-09 → 17-10 → 17-08):** UAT surfaced 4 blockers + 1 release-blocker on Phase 17 after baseline close. The wave-batching orchestrator would have parallelized chat-surface mutations, muddying D-26 attribution. Forcing each gap-closure plan into its own wave (one plan per wave) kept attribution clean and let Plan 17-08 run LAST as the release-blocker deploy gate. Pattern: serial-chain plans when D-26 attribution matters, even when wave-batching looks more efficient
- **Single Worker binding for static + API + cron:** Phase 17's Workers Static Assets migration unlocked the cleanest architecture choice in the project — one `wrangler deploy` ships the entire site + API + scheduled handler. Previous Pages/Worker hybrid would have required separate deploys, cross-binding KV access, and split observability
- **Cross-AI plan review surfaced Pitfall 8 (Astro APIRoute locals.runtime.ctx access path):** SPIKE-ctx-access-path.md in Phase 18 Plan 18-01 resolved the binding-access path before any KV write was attempted. Spike-before-implement saved a likely 2-3-plan rework cycle
- **Build-time source-text forward-defense as a first-class test type:** Phase 17 Plans 17-03 / 17-04 / 17-05 / 17-08 / 17-10 + Phase 19 Plan 19-03 + Phase 20 Plan 20-03 all used `readFileSync` + regex/substring assertions on canonical decision-bearing source files. Catches regressions that pass behavioral tests but reintroduce forbidden patterns (imperative display flip; first-person leaks; Anthropic-payload sessionId leak; DRY_RUN re-enabling; `import.meta.env.DEV` single-signal regression)

### What Was Inefficient

- **WR-04 dev-403 regression discovered AT the deploy gate by the gate itself** (Phase 17 Plan 17-08 Task 2-ALPHA Rule 3 inline deviation): `pnpm dev` POST `/api/chat` returned 403 Forbidden because `@astrojs/cloudflare` adapter does NOT statically replace `import.meta.env.DEV` in SSR routes the way Vite does in client bundles. Single-signal `ALLOW_LOOPBACK` gate had been dead since the adapter swap. The dev gate caught the prod-builds dev-experience cliff cleanly, but the underlying assumption ("Vite replaces `import.meta.env.DEV` everywhere") should have been validated upstream. Pattern: don't trust framework-replaced env booleans across adapter/runtime boundaries without explicit verification
- **Listener-dedup ts(7006) typecheck debt carried 4 plans deep before absorption** (Plan 17-03 → 17-04 → 17-05 → 17-06 → 17-08 absorbed): `tests/client/listener-dedup.test.ts` ts(7006) implicit-any errors on callback parameters carried for 4 plans before Plan 17-08 Rule 3 cleanup absorbed them with one-line annotations. `pnpm exec astro check` showed 0/0/0 cleanly only at Plan 17-08. Pattern: typecheck debt that surfaces mid-phase MUST be either fixed in the introducing plan OR explicitly tracked in `deferred-items.md` per phase, not allowed to drift
- **Cross-phase test fragility introduced by Phase 20 atomic flip:** `tests/build/worker-scheduled-call-site.test.ts` Invariant F regex `/DRY_RUN\s*:\s*(?:"1"|string)/` was authored in Phase 19 when DRY_RUN was `"1"`. After Phase 20 flipped to `"0"`, the test passed only because of an incidental comment match in `worker.ts:46`, NOT the actual Env field declaration. Plan 20-03's `wrangler-dry-run-shape.test.ts` correctly asserted `"0"`, but the older Phase 19 test wasn't updated in lockstep. Pattern: when a plan flips a value that an upstream phase locked, audit all build-time tests that asserted the prior value and update them in the same atomic commit
- **Frontmatter attribution gaps (Phase 17 plans 17-07..10 + Phase 19 plans 19-01..04):** `requirements-completed:` field missing from plan frontmatter. Requirements still covered by VERIFICATION.md + traceability table, but the frontmatter is the primary signal consumed by audit tooling. Documentation hygiene only — but the third time this milestone-tier pattern has occurred (v1.2 had CONT-01..07 + CHAT-06 drift)
- **Traceability table staleness flagged at audit time, not phase-close time:** REQUIREMENTS.md still marked MAIL-01..05 as `[ ]` Pending and "Pending" in traceability table even after Phase 20 VERIFICATION.md confirmed all 5 SATISFIED. Cleanup applied at v1.3 milestone close. Pattern persists across v1.1, v1.2, v1.3 — every milestone catches this at audit. Suggests requirement-tier mutation needs to be enforced mechanically (e.g., milestone-audit `--fix` mode that flips checkboxes based on VERIFICATION.md `status: passed` files)
- **Cron flip operator UAT (Phase 19) blocked at executor side per D-12 / DEPLOY-GATE.md:** All four CRON-01..04 success criteria closed-by-design at build/unit-test layer (32/32 PASS); live-PROD Past Events + wrangler tail + KV seed verification are human-only. The build-layer gate is correct, but operator UAT closure of 19-UAT.md Steps 1-5 is still pending at v1.3 close (cron is ACTIVE in production per Phase 20 UAT Step 2 evidence — indirect verification). Pattern: when a phase's success criteria are "live-PROD operator UAT," that operator UAT is a deferred item, not a phase-gate

### Patterns Established

- **Workers Static Assets single-binding architecture:** Single Worker entrypoint (`src/worker.ts`) re-exports Astro's `handle()` for fetch + adds `scheduled()` that delegates to a pure module via `ctx.waitUntil(...).catch(...)`. Unlocks single-deploy, single-binding-KV-access, unified observability. Generalizable to any Astro site that needs cron / API / scheduled handlers
- **Two-keyspace partition with PUT-before-POST crash-safe ordering:** `live:{sid}` (active) → `delivered:{sid}` (24h cursor, PUT before external POST) → `live:{sid}` DELETE (after success). External-side idempotency-key (Resend 24h window) layers on top. Application-side cursor is the replay detector; external-side key is the defense-in-depth. Pattern generalizes to any "promote pending → done with crash safety + idempotency" workflow
- **3-variant discriminated Result for external API calls (D-17):** `sent` / `failed_transient` / `failed_terminal` — no `replayed` variant. Application-side cursor (Layer 1) IS the replay detector; external-side idempotency-key is invisible to the call site. Removes the temptation to treat replay as a Result variant — replay is a no-op at the call site
- **D-03 rollback runway preserved BYTE-IDENTICAL in source:** Source-text build guards lock the presence of the rollback branch even after a feature is flipped on. Single-line revert path at any moment without code churn. Pattern: when flipping a feature flag, KEEP the off-path code alive as the rollback runway, with a build guard asserting its byte-identical presence
- **Build-time source-text forward-defense as first-class test type:** `readFileSync` + regex/substring assertions on canonical source. Catches regressions that pass behavioral tests but reintroduce forbidden patterns. Cheap to write; expensive to debug without. Applied in 7+ Phase 17/19/20 plans
- **DEPLOY-GATE.md as the canonical human-only deploy gate artifact:** Single file per phase, 5-section pre-deploy checklist + executor-MUST-NOT-push prohibition + named-operator-signed status confirmation + post-deploy verification checklist. Phase 17 Plan 17-08 established the template; Phase 20 Plan 20-04 mirrored it. Pattern: human-only deploy gates get a durable artifact, not a chat-message confirmation
- **Spike-before-implement when a binding-access path is uncertain:** Phase 18 Plan 18-01 authored SPIKE-ctx-access-path.md to resolve Pitfall 8 (Astro APIRoute locals.runtime.ctx) before any KV write was attempted. Spike-as-plan-deliverable patterns ahead of high-uncertainty work
- **M-iter2 serial-chain when D-26 attribution matters:** When chat-surface mutations cannot run parallel without muddying the chat regression battery's attribution, force each plan into its own wave (one plan per wave). Wave-batching orchestrators correctly parallelize independent file changes; M-iter2 correction forces serial discipline when independence is illusory

### Key Lessons

1. **Don't trust framework-replaced env booleans across adapter/runtime boundaries** — `import.meta.env.DEV` is replaced by Vite in client bundles but NOT by `@astrojs/cloudflare` adapter in SSR routes. Three-signal disjunctions (`import.meta.env.DEV === true) || (import.meta.env.MODE === "development") || (process.env.NODE_ENV === "development")`) are more verbose but more honest about the runtime contract. Verify framework env semantics across every adapter boundary before depending on them
2. **Typecheck debt MUST be fixed in the introducing plan or explicitly tracked in `deferred-items.md`** — letting ts(7006) drift 4 plans deep (listener-dedup Phase 17) compounds the cleanup cost and forces a Rule 3 inline absorption later. Same plan, same commit, every time
3. **Audit tests that asserted prior values when flipping locked constants** — Phase 19 → Phase 20 DRY_RUN flip degraded a Phase 19 build guard's lock fidelity because the test author didn't audit the older test in lockstep. Pattern: any plan that flips a value must grep for all build-time tests asserting the prior value and update in the same atomic commit
4. **Requirement-tier checkbox mutation needs mechanical enforcement, not discipline** — v1.1, v1.2, v1.3 have all caught traceability staleness at milestone audit. Three milestones is a pattern. Suggests `gsd-audit-milestone --fix` mode that mechanically flips checkboxes based on VERIFICATION.md `status: passed` files at audit time
5. **Spike-before-implement for high-uncertainty binding-access paths** — Phase 18 Plan 18-01's SPIKE-ctx-access-path.md saved a likely 2-3-plan rework cycle. Pattern: when "how do I access X from Y" is uncertain at plan-time, ship a spike artifact as the plan deliverable before writing real code
6. **D-03 rollback runway: KEEP the off-path code alive, locked by build guards** — feature flips that delete the off-path lose the single-line revert option. Source-text build guards make "keep the runway" a non-negotiable mechanical contract, not a discipline
7. **Operator UAT closure on dashboard-only actions is a deferred item, not a phase-gate** — Phase 19's live-PROD operator UAT is structurally blocked at the executor side per D-12 / DEPLOY-GATE.md. Code/build-side gates are correct phase-gates; operator-only dashboard verification is a milestone-level deferred-item that the audit acknowledges and documents
8. **Workers Static Assets unlocks the cleanest "single Worker for everything" architecture for content-first sites** — Pages/Worker hybrid would have required separate deploys, cross-binding KV access, split observability. The migration cost (1 phase, 10 plans incl. gap closure) was worth the architectural simplification

### Cost Observations

- Model mix: Primarily opus-4 / opus-4.6 for execution + plan authoring + research; sonnet-4.6 for verification agents + lighter doc tasks
- Sessions: ~15 across 4 days (2026-05-09 → 2026-05-13) — densest velocity of any v1.* milestone
- Notable: Phase 17 (10 plans incl. 4 gap-closure plans across 4 waves) was the highest-touch; Phase 19 (4 plans across 4 waves) was the cheapest per-plan due to pure-module + source-text build guards + zero chat-surface mutations

---

## Milestone: v1.4 — Professional Experience

**Shipped:** 2026-07-14
**Phases:** 5 (21-25) | **Plans:** 22 | **Tasks:** 53 | **Commits:** 204 since `v1.3` over ~7 days

### What Was Built

- **Phase 21 — Experience Content Pipeline & Collection:** Zod-validated `experience` collection fed from `Experience/*.md` via `sync-experience.mjs` (fenced-block extraction mirroring `sync-projects.mjs`, idempotent `--check` drift gate wired into CI); `sortExperienceEntries` reverse-chron ordering + field contract; two entries double as schema-optionality fixtures (Holloway present-role/no endDate, Balfour empty techStack); zero new deps
- **Phase 22 — Experience Page & Holloway Case Study:** experience-first primary nav → `/experience` two-tier listing (Holloway scannable summary → `/experience/holloway` deep-dive with dual back-links; Balfour lightweight "Earlier" entry structurally excluded from any detail route via `getStaticPaths` `hasCaseStudy` filter); D-08 company normalization; tests-first suite (623 green incl. D-26 battery); frontend-design SC5d visual sign-off
- **Phase 23 — Projects Reconciliation & Featured Tier:** Multi-Chain EVM (#7) synced as a full case study; exactly 3 featured (SeatWatch / Multi-Chain EVM / NFL Prediction) in a two-tier FEATURED/MORE WORK layout on `/projects` + Home, remaining 4 accessible below; single `featured`/`order` distinction drives both surfaces; #7 held out of the chat corpus until Phase 25 (D-15); WorkRow optional `tagline` prop byte-identical when absent
- **Phase 24 — Positioning Shift & Home Teaser:** new-grad-with-production-experience framing across Core Value / About / education / metadata; `education.ts` SSoT feeding both the JSON-LD Person schema + the `/about` Education block; Home `01 EXPERIENCE` Holloway teaser (deep-link + 0→~1,400 test metric, sections renumbered 01–04); enriched Person schema (jobTitle / alumniOf / hasCredential); real 1200×630 true-Geist `og-default.png`; Gate A em-dash/register banlist across all five copy surfaces
- **Phase 25 — Chat Knowledge Refresh & Milestone Verification:** `portfolio-context.json` regenerated with the Experience content + #7 in third person (D-04 exclusion lifted, corpus 6→7 untruncated, education single-sourced), CHAT-06 leak guard green; capstone gate green (build 0, 692 pass / 2 skip, astro check 0/0/0, four D-14 gated files + deps byte-identical phase-wide via `verify-phase25-invariants.mjs`); live chat UAT approved incl. exfiltration + PII probes

### What Worked

- **Pipeline reuse over reinvention (EXP-01):** building `sync-experience.mjs` as a mirror of the proven `sync-projects.mjs` gave the Experience surface a battle-tested content workflow for near-zero design cost. Clone the established sync pipeline when a new content type appears rather than inventing a parallel mechanism
- **Structural exclusion over convention (D-01 `hasCaseStudy`):** Balfour's "no full case study" (EXP-05) is enforced at the `getStaticPaths` layer — the route literally doesn't build — rather than by a soft convention or a hidden flag. The build output IS the proof
- **Per-phase committed-drift invariant baselines (`24-BASELINE.json` / `25-BASELINE.json`):** hashing the D-14 gated files + normalized deps at phase start let the capstone prove phase-wide byte-identity against COMMITTED drift, not just a working-tree diff — closing the gap where a mid-phase commit could touch a gated file that a working-tree-only check would miss
- **Typed SSoT with DERIVED fragments for cross-surface facts (`education.ts`, D-10):** deriving both the Person-schema fragments AND the chat education object from one module made WGU/VT/LPI desync across the Person schema, `/about`, and the chat corpus impossible
- **Deliberate staged corpus lift (D-15 → D-04, Phases 23→25):** #7 was synced to the site in Phase 23 but explicitly held OUT of the chat corpus (slug-continue guard) until Phase 25's atomic build-engine migration lifted the exclusion — keeping the corpus byte-stable through the UI phases and confining the shape change to one reviewable atomic plan
- **Gate A closed the voice-gate scope gap:** the em-dash/banlist gate had only ever scanned MDX; v1.4 surfaced that `about.ts` / `education.ts` / `ContactSection.astro` literals were unscanned. Authoring Gate A at the Phase 24 capstone boundary — where all five copy surfaces were simultaneously clean — closed it

### What Was Inefficient

- **Frontmatter attribution gaps recurred (Phase 22 EXP-03/04/05, Phase 23 PROJ-01..04):** the `requirements-completed:` SUMMARY frontmatter was under-populated again — the FOURTH milestone with this pattern (v1.1/v1.2/v1.3/v1.4). Coverage was still proven by each VERIFICATION.md + the integration check, but the 3-source cross-reference flagged it every time. The mechanical-enforcement lesson from v1.3 is now overdue
- **About P2 churned across two phases (24 → 25):** `ABOUT_P2` was kept verbatim at plan time (D-06), then CUT at the Phase 24 UAT per Jack's copy review — reversing D-06 and forcing coupled edits in `about.ts` + `about.astro` + `about-data.test.ts`, then again in Phase 25's chat copy. A copy-review pass BEFORE locking D-06 would have avoided the two-phase reversal
- **OG card font fell back to Arial on first render (24-04):** librsvg/sharp ignore `@font-face` and can't read the Geist woff2, so the first `og-default.png` rendered in Arial and had to be re-rendered via a browser-screenshot mechanism to get true Geist. The toolchain's font limitation should have been verified before the first render
- **Stale pre-milestone artifacts accumulated until close:** the pre-close audit surfaced 16 open items — 8 diagnosed debug sessions (3 obsoleted by v1.1 feature removals), 4 completed-but-unmarked quick tasks, 4 pending todos (1 already delivered in Phase 24). None were v1.4 work; all were v1.0–v1.3 bookkeeping never closed at the time

### Patterns Established

- **Clone-the-sync-pipeline for new content types:** new collection + a sync script mirroring the established pipeline (fenced extraction, Zod, idempotent `--check`, CI drift gate). Generalizes to any "author in Markdown, validate + render as a typed collection" need
- **Structural absence as the enforcement mechanism:** "this route / case study must not exist" encoded as a `getStaticPaths` filter so the build output is the proof, not a convention or a soft flag
- **Per-phase committed-drift invariant baseline:** hash protected files + normalized deps at phase start into `NN-BASELINE.json`; `verify-phaseNN-invariants.mjs` compares at the capstone to prove phase-wide byte-identity against committed history
- **Typed SSoT with DERIVED fragments for cross-surface facts:** one module owns the facts; schema / JSON-LD / prose / chat all consume DERIVED fragments; re-hardcoding is banned
- **Staged data lift behind an explicit guard:** land a data change on the low-risk surface first, hold it off the high-risk surface behind a named guard, lift it in a dedicated atomic plan with its own review

### Key Lessons

1. **Clone the proven sync pipeline for new content types** — `sync-experience.mjs` mirroring `sync-projects.mjs` delivered a battle-tested content workflow for near-zero design cost
2. **Encode "must not exist" as structural absence the build enforces** — Balfour's no-case-study (EXP-05) lives at the `getStaticPaths` layer; the un-built route IS the proof. Structural guarantees beat conventions
3. **Baseline invariants against committed history, not the working tree** — hashing gated files + deps at phase start (`NN-BASELINE.json`) closes the gap where a mid-phase commit touches a protected file that a working-tree-only diff would miss
4. **Extract cross-surface facts to a typed SSoT with DERIVED fragments** — `education.ts` feeding the Person schema + `/about` + chat corpus made the WGU/VT/LPI facts impossible to desync. Re-hardcoding the same fact on 3+ surfaces is the bug waiting to happen
5. **Stage risky data changes behind an explicit guard and lift them atomically** — #7 on the site (Phase 23) but out of the chat corpus until Phase 25's atomic migration kept the corpus byte-stable through the UI phases
6. **Run human copy review BEFORE locking "keep verbatim" decisions** — the About P2 keep→cut reversal churned two phases because the copy review came after D-06 was locked
7. **Verify a headless-render toolchain's font support before brand-critical assets** — librsvg/sharp silently fell back to Arial on the Geist OG card
8. **Close bookkeeping artifacts when the work lands, not at the next audit** — 16 stale debug/quick/todo items accumulated from v1.0–v1.3; combined with the four-milestone-deep frontmatter-attribution gap, both point to mechanical close-out enforcement over discipline

### Cost Observations

- Model mix: Opus for execution + plan authoring + research + the milestone audit; lighter models for verification/doc agents
- Sessions: spread across ~7 days (2026-07-08 → 2026-07-14); lower daily density than v1.3's 4-day sprint
- Notable: Phase 25 was the highest-stakes (chat-surface corpus migration under the D-14/D-26 byte-identical gate) but landed cleanly via the atomic-migration + committed-drift-baseline pattern; the UI phases (22/23/24) each carried a frontend-design human sign-off

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~10 | 6 | 27 | Established GSD workflow, design reference pattern |
| v1.1 | ~15 | 4 | 27 | Added phased rebuild shape (Foundation→Primitives→Pages→Polish) and design-contract-first discipline |
| v1.2 | ~20+ | 5 | 34 | Added Wave 0 RED stubs every phase, named cross-phase gates (D-15/D-26), wave-based plan dependency graphs, source-of-truth → sync-pipeline content workflow |
| v1.3 | ~15 | 4 | 26 | Added build-time source-text forward-defense as first-class test type, D-03 rollback runway preserved byte-identical in source, M-iter2 serial-chain for D-26 attribution discipline, DEPLOY-GATE.md as canonical human-only deploy gate artifact, spike-before-implement for binding-access uncertainty |
| v1.4 | n/a | 5 | 22 | Added clone-the-sync-pipeline for new content types, structural absence (`getStaticPaths`) as the enforcement mechanism, per-phase committed-drift invariant baselines (`NN-BASELINE.json` + verifier), typed SSoT with DERIVED fragments for cross-surface facts, staged data-lift behind an explicit guard |

### Top Lessons (Verified Across Milestones)

1. Always provide a visual design reference — blind AI design iterations waste time (v1.0 + v1.1)
2. Milestone-level audit catches cross-phase gaps that per-phase verification misses (v1.0 + v1.1 + v1.2 + v1.3 + v1.4 — v1.4's pre-close audit also surfaced 16 stale pre-milestone bookkeeping artifacts from v1.0–v1.3 that per-phase work never closed)
3. Write the design contract / gate contracts before writing code — MASTER.md-as-task-1 eliminates per-phase drift (v1.1); D-15/D-26 gate naming generalizes the pattern (v1.2); D-03 rollback runway extends it to feature flips (v1.3)
4. Phase rebuilds as foundation → primitives → pages → polish (v1.1) — generalized in v1.2 to: stable foundation → instrumented baseline → bold change; v1.3 added: migration foundation → identity layer → mechanism (DRY_RUN) → delivery flip
5. Wave 0 RED stubs as the nyquist insertion point (v1.2, new) — confirmed in v1.3 (every phase opened with build-time + unit tests before implementation)
6. Requirement-tier checkbox mutation + `requirements-completed:` frontmatter must be part of plan close-out, not deferred (v1.1 mild + v1.2 strong + v1.3 strong + v1.4 strong) — the pattern is now FOUR milestones deep (v1.4 under-populated Phase 22/23 frontmatter), which decisively suggests mechanical enforcement via a `gsd-audit-milestone --fix` mode rather than discipline
10. Clone the proven sync pipeline for new content types rather than inventing a parallel mechanism (v1.4, new) — `sync-experience.mjs` mirrored `sync-projects.mjs` for near-zero design cost
11. Encode "must not exist" as a structural absence the build enforces (v1.4, new) — EXP-05's Balfour no-case-study lives at the `getStaticPaths` layer; the un-built route IS the proof, beating any convention or soft flag
12. Baseline phase invariants against committed history, not just the working tree (v1.4, new) — `NN-BASELINE.json` hashing gated files + deps at phase start closes the mid-phase-commit blind spot a working-tree diff would miss
13. Extract cross-surface facts to a typed SSoT with DERIVED fragments (v1.4, new) — `education.ts` made the WGU/VT/LPI facts impossible to desync across the Person schema, `/about`, and the chat corpus
14. Close bookkeeping artifacts (debug sessions, quick tasks, todos) when the work lands, not at the next milestone's audit (v1.4, new) — 16 stale items accumulated across v1.0–v1.3
7. Pre-existing carry-forward items need backlog promotion at milestone START (v1.2, new) — v1.3 absorbed all 5 v1.2 chat carry-forward items (DEBT-01..05) in Phase 17 Wave 4, validating the pattern
8. Build-time source-text forward-defense catches regressions that pass behavioral tests (v1.3, new) — pattern emerged in Phase 17 Plan 17-03 / 17-04 / 17-05 / 17-08, generalized across Phase 19 / 20
9. D-03 rollback runway preserved byte-identical in source (v1.3, new) — every feature flip keeps the off-path alive as the rollback target, locked by build guard. Single-line revert at any moment
