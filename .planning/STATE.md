---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Professional Experience
current_phase: 25
current_phase_name: Chat Knowledge Refresh & Milestone Verification
status: ready
stopped_at: Phase 25 planned — 4 plans, 3 waves
last_updated: "2026-07-14T16:40:45.000Z"
last_activity: 2026-07-14
last_activity_desc: Phase 25 planned — 4 plans across 3 waves; plan-checker VERIFICATION PASSED; ready to execute
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 21
  completed_plans: 17
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-08)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** Phase 25 — Chat Knowledge Refresh & Milestone Verification (Phase 24 complete)

## Current Position

Phase: 25 — Chat Knowledge Refresh & Milestone Verification
Plan: 4 plans across 3 waves (Wave 1: 25-01 + 25-02 parallel · Wave 2: 25-03 · Wave 3: 25-04)
Status: Phase 25 planned; plan-checker VERIFICATION PASSED (14/14 decisions + 4/4 requirements covered); ready to execute
Last activity: 2026-07-14 — Phase 25 planned (RESEARCH + VALIDATION + PATTERNS + 4 PLANs committed; plan-checker PASSED)
Progress: [████████░░] 80% (4/5 phases)

### v1.4 phase map

| Phase | Goal | Requirements | UI |
|-------|------|--------------|----|
| 21 — Experience Content Pipeline & Collection | Typed `experience` collection fed from `Experience/*.md` via a sync script mirroring the projects pipeline | EXP-01, EXP-06 | — |
| 22 — Experience Page & Holloway Case Study | Experience page + nav; Holloway scannable summary → deep-dive; Balfour lightweight entry | EXP-02..05 | UI |
| 23 — Projects Reconciliation & Featured Tier | Sync Multi-Chain EVM (#7); feature SeatWatch / Multi-Chain EVM / NFL Prediction; keep the rest below | PROJ-01..04 | UI |
| 24 — Positioning Shift & Home Teaser | New-grad-with-production-experience framing (Core Value, About, education, metadata); Home Holloway teaser | POS-01..04, HOME-01 | UI |
| 25 — Chat Knowledge Refresh & Milestone Verification | Regenerate `portfolio-context.json` with experience + project #7 (third-person voice split); hold D-26/D-15/astro-check/Lighthouse gates | CHAT-10, CHAT-11, QA-01, QA-02 | — |

### Latest snapshot at v1.3 close

- Production deployment live at https://jackcutrara.com on single Cloudflare Worker (`jack-cutrara-portfolio`, version `ede1431f-e92a-4fda-af54-4f8f57781d3b`)
- Hourly cron `["0 * * * *"]` ACTIVE; first live transcript email delivered to Jack's Gmail Inbox confirmed 2026-05-13 (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`, Gmail Inbox arrival 14:00:53Z)
- `pnpm test` 560 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0 (116 files); `package.json dependencies` byte-identical phase-wide
- Pages project retired manually via Cloudflare dashboard 2026-05-13 (FOUND-03 fully closed at milestone close)

## Accumulated Context

### Decisions

All v1.0/v1.1/v1.2/v1.3 milestone-level decisions logged in PROJECT.md Key Decisions table. Plan-level decision history retained in archived `.planning/milestones/v1.*-phases/*/SUMMARY.md` and `.planning/RETROSPECTIVE.md`.

v1.4 roadmap-level notes carried into planning:

- **Experience pipeline reuse (EXP-01):** build a parallel `Experience/*.md → experience` collection + sync script mirroring `scripts/sync-projects.mjs` (fenced-block extraction, Zod-validated, idempotent `--check`). Do not invent a new mechanism.
- **Projects schema already supports featuring (PROJ-04):** `src/content.config.ts` already carries `featured: boolean` + `order: number` — reconciliation is applying them consistently, not adding schema.
- **Chat #7 exclusion must be lifted (CHAT-10 / PROJ-01):** `scripts/build-chat-context.mjs` currently hard-fails on `Projects/7` via the D-04 `/MULTI[- ]?DEX/` regex and the source allow-list. Syncing #7 (Phase 23) and ingesting it into chat (Phase 25) both require deliberately lifting that exclusion.
- **Voice split (CHAT-06) holds:** site copy is first person (`about.ts`, MDX bodies); chat consumes third-person variants (`about-chat.ts`, MDX `chatSummary`). The build-time `checkFirstPersonLeaks` guard hard-fails on leakage — new experience content needs a third-person chat variant.
- [Phase ?]: Phase 21-01: shipped sortExperienceEntries helper (SC3 finding #3) as a Phase-22-consumable ordering contract, not a reworded criterion
- [Phase ?]: Phase 21-01: path-escape test asserts err.status===2 in addition to the message (finding #2); added write-mode idempotency test asserting mtime+contents unchanged (finding #1)
- [Phase 21]: Experience schema: techStack unbounded (no .min(1)) and highlights.max(5) with no hard min so empty/lightweight entries validate (Pitfall 4 / A1)
- [Phase ?]: Phase 21-03: two real experience entries double as schema optionality fixtures (Holloway omits endDate/present role, Balfour techStack: [] non-engineering); MDX bodies machine-synced from fenced Experience/*.md sources, deps unchanged 11/12
- [Phase ?]: Phase 22-01: authored Wave 0 tests-first suite (nav/summary/detail RED, em-dash GREEN); 3 files intentionally RED until Wave 2 ships pages+nav+D-08 normalization
- [Phase 22]: Phase 22-02: added experience-first nav to Header+MobileMenu with startsWith('/experience') active branch; did NOT edit v1.1-locked MASTER.md three-link contract (supersession recorded in SUMMARY, not spec)
- [Phase 22]: 22-03: /experience two-tier — Holloway featured (display + accent CTA) vs Balfour non-linked mono 'Earlier' entry; highlights as hairline ledger (not numbered)
- [Phase 22]: 22-03: deep-dive link uses static href=/experience/holloway (Wave-0 test regex needs quote-adjacent href) + build-time id-invariant guard; company normalized to 'Holloway Company' (D-08)
- [Phase ?]: 22-04: D-02 back link uses a persistent leading arrow (color-only hover, no reveal, no translate) per frontend-design ruling
- [Phase ?]: 22-04: getStaticPaths filters hasCaseStudy so only /experience/holloway builds; balfour structurally excluded (EXP-05)
- [Phase 22]: 22-05: capstone gate green — astro check 0/0, pnpm test 623 pass/2 skip (incl D-26 chat battery), sync drift 0, build route set correct (dist/client, balfour absent), QA-02 dep-lock exit 0; SC5d visual sign-off APPROVED (nav no-wrap at 768/1024px, 404 on balfour route, zero em dashes)
- [Phase ?]: Phase 23-01: D-15 chat exclusion re-plumbed as an explicit multi-chain-evm slug-continue at the top of build-chat-context.mjs before both hard-fails; defensive MULTI-DEX regex retained dormant; Phase 25 lifts it
- [Phase ?]: Phase 23-01: SolSniper demoted to featured:false (kept, order 4); exactly 3 featured (seatwatch/multi-chain-evm/nfl-predict), order contiguous 1-7, proven by tests/content/projects-ordering.test.ts
- [Phase ?]: 23-02: multi-chain-evm added to all six site-side content gates (D-16 exhaustiveness); chat-side pins untouched so chat stays 6 until Phase 25
- [Phase 23]: 23-03: WorkRow extended with optional tagline (structural title:has(+ .work-tagline) 8px override → byte-identical when absent, no modifier class, no fork); /projects two-tier FEATURED/MORE WORK via featured-partition, tier sub-labels mirror experience.astro earlier-divider (48px break), rows numbered off order 01-07
- [Phase 23]: 23-03: Home teaser gains taglines (same primitive) + a See all work link mirroring .read-more with the deep-link arrow reveal; all page/primitive-scoped CSS — global.css & BaseLayout.astro untouched (T-23-03 mitigated); SC2 render gate parses built HTML for exactly 3 .work-tagline elements (F7 DOM count, not substring)
- [Phase 23]: 23-04: capstone gate green end-to-end (build 0/0/0 + dist/, 637 pass/2 skip, F3 no-drift, dep-lock exit 0, no schema change); both human sign-offs APPROVED (#7 copy D-02/D-03, frontend-design 6-pillar SC5); re-run over two scoped fix(23) cleanups e1796ed+517f6b5
- [Phase 24]: 24-01: education.ts is SSoT; alumniOfSchema+hasCredentialSchema DERIVED from EDUCATION/CREDENTIALS (no re-hardcoded WGU/VT); Gate D asserts derivation linkage + VT alumniOf-only (D-10)
- [Phase 24]: 24-01: captured phase-start invariant baseline (24-BASELINE.json: 8 protected-file hashes + deps) + verify-phase24-invariants.mjs (Node built-ins only) so 24-04 proves phase-wide D-19/D-17 across committed tasks (review fix #4)
- [Phase 24]: 24-01: Gate E strengthened to 11 anchors (SEO + ChatWidget import/render + pageswap .finished?.catch + 3 client-script imports; review fix #6)
- [Phase 24]: 24-02: Home opens with the 01 EXPERIENCE Holloway teaser reusing the SAME id-guarded experience query (hasCaseStudy find + holloway.id throw, index.astro-prefixed) as experience.astro; no data duplication (D-05); teaser CSS page-scoped, global.css/BaseLayout untouched (D-19)
- [Phase 24]: 24-02: sections renumbered 01/02/03/04 (WORK/ABOUT via SectionHeader props, CONTACT via ContactSection literal); ContactSection doc comments stripped of 3 em dashes closing the non-MDX voice-gate scope gap before 24-04 Gate A
- [Phase 24]: 24-02: personSchema enriched with jobTitle + DERIVED alumniOf/hasCredential from education.ts (POS-04, no re-hardcoded literals); SEO description sharpened + distinct from unchanged hero lead (D-08/D-15); Gate B/C (home-teaser-render) authored HERE + GREEN (6/6), JSON.parses ld+json + verbatim hero-lead regression guard
- [Phase 24]: 24-03: About INTRO/P1/P3 revised to honest new-grad-with-production-experience register (dropped self-applied seniority qualifier, D-07); ABOUT_P2 kept byte-identical (D-06); revision propagates to Home via about.ts SSoT with no index.astro edit
- [Phase 24]: 24-03: /about Education block leads with the completed WGU B.S. CS (May 2026); VT rendered only as a 'Transferred from Virginia Tech' sub-note composed from EDUCATION.transferredFrom (never a credential, D-10); all four visible facts read from education.ts; middot (U+00B7) separators hold the zero-em-dash rule; page-scoped CSS only (global.css/BaseLayout untouched, D-19)
- [Phase 24]: 24-03: POS-03 covered by tests/build/about-education-render.test.ts (jsdom dist render: four facts + no-accent + POS-01/02 positive body claims, review fix #6); astro check 0/0/0
- [Phase ?]: [Phase 24]: 24-04: OG card re-rendered in TRUE Geist per the human checkpoint (librsvg/sharp ignores @font-face + cannot read Geist woff2, fell back to Arial); regenerated dep-free via the plan's sanctioned page-scoped HTML card screenshot through a browser (QA-02 holds); commit 6bbfb8b supersedes 36fa440
- [Phase ?]: [Phase 24]: 24-04: Gate A (tests/content/site-copy-em-dash.test.ts) authored at the capstone boundary where all five voice-gate-unscanned files are simultaneously clean — GREEN at its own boundary + register banlist junior/senior/5+ years (review fix #1, D-18)
- [Phase ?]: [Phase 24]: 24-04: capstone gate green (build 0, test 677 pass/2 skip incl D-26 battery + sse-snapshot, astro check 0/0/0, OG verifier 0, invariant verifier 0, portfolio-context.json byte-identical); all four human sign-offs APPROVED; POS-04 complete — Phase 24 done
- [Phase 24]: 24-UAT: removed About ABOUT_P2 ("I reach for the boring tool first...") per Jack's copy review — REVERSES D-06 (P2 was kept verbatim). Coupled edits: about.ts export + about.astro import/render + about-data.test.ts (P2 import/assertion/word-count). build-chat-context.mjs left untouched (24-01 protected file; its dead parseAboutExports still lists ABOUT_P2); chat about block sourced from about-chat.ts so portfolio-context.json stayed byte-identical (commit c1c2022)
- [Phase 24]: 24-UAT: verify-work 14/14 pass (11 auto-verified via Playwright + live DOM + verifier scripts + gate tests; 3 human checkpoints APPROVED — Home teaser/positioning, /about register, OG card); full suite 676 pass/2 skip after the P2 fix
- [Phase 24]: 24-SECURITY: retroactive secure-phase — 7 threats CLOSED / 0 open (ASVS L1 short-circuit; register authored at plan time). OG card + supply-chain accepted risks logged; no new surface from the copy phase or the P2 fix (commit d6d1696)

### Open Blockers

(none — Phases 21–24 complete and verified; Phase 25 not started)

### Deferred Items (carried into next milestone or organic-evidence wait)

- **SC4 organic-traffic idempotency-in-the-wild closure** — pending 2026-05-20 (7-day soft cap from Phase 20 deploy). Layer 1 `delivered:{sid}` cursor + Layer 2 Resend `Idempotency-Key` 24h window structurally unit-locked at both layers; first organic visitor session post-deploy closes SC4. Soft-cap proxy path: `node scripts/resend-warmup.mjs`. Result block: `.planning/milestones/v1.3-phases/20-email-render-resend-integration/20-UAT.md` Step 6.
- **Cross-phase test fragility** — `tests/build/worker-scheduled-call-site.test.ts` Invariant F regex `/DRY_RUN\s*:\s*(?:"1"|string)/` now passes via comment match after Phase 20 DRY_RUN flip. Functional wiring unaffected; lock fidelity degraded. Fix: broaden regex to accept `"0"` literal. Low-priority `/gsd-quick`.
- **Dashboard-only secrets** — `CHAT_SENDER_EMAIL` + `CHAT_RECIPIENT_EMAIL` live exclusively as Wrangler dashboard secrets with no in-repo `.dev.vars` fallback documented. Operationally correct but invisible deployment dependency. Document or add `.dev.vars.example` in v1.4+.
- **Frontmatter attribution gaps** — Phase 17 plans 17-07/08/09/10 + Phase 19 plans 19-01..04 omit `requirements-completed:` field. Requirements still covered by VERIFICATION.md + traceability table — documentation hygiene only.
- **Pre-existing Resend DNS dust on `send.*` + root** — no conflict with `mail.*` scope; scheduled as low-priority `/gsd-quick` cleanup.
- **KV probe key** `live:00000000-0000-4000-8000-000000000001` in PROD — 30-day TTL expires ~2026-06-10; safe to leave or delete.
- **WR-04 `pnpm dev:worker` 403 cliff** — Vite production build inlines `process.env.NODE_ENV → "production"`; three-signal `ALLOW_LOOPBACK` was designed for astro dev, not for wrangler dev serving a prod-built bundle. Real blind spot, documented but not patched (out of phase scope).
- **`CHAT_RATE_LIMITER` Workers Paid binding** — documented + Free-tier acceptable. v1.4+ trigger if Anthropic spend or chat volume crosses thresholds that justify $60/yr.

### Resolved Blockers

(cleared at v1.3 milestone close — all v1.3-era blockers resolved)

---

## Roadmap Snapshot

v1.4 Professional Experience roadmap created 2026-07-08 — 5 phases (21-25), 19/19 requirements mapped (0 unmapped). Phase numbering continues from v1.3 (which ended at Phase 20). See `.planning/ROADMAP.md` for full phase detail + success criteria.

**Sequencing:** 21 (Experience pipeline/collection — foundational) → 22 (Experience page + Holloway, UI) → 23 (Projects reconciliation + featured tier, UI) → 24 (Positioning + Home teaser, UI) → 25 (Chat knowledge refresh + milestone verification). Phase 25 depends on 22/23/24 (needs Experience content, synced project #7, and finalized positioning before regenerating chat knowledge and running the gate pass).

v1.3 phases (17-20) shipped and archived — see `.planning/milestones/v1.3-ROADMAP.md`.

## Session

**Last session:** 2026-07-14T16:40:45.000Z
**Stopped at:** Phase 25 planned (ready to execute)
**Resume file:** .planning/phases/25-chat-knowledge-refresh-milestone-verification/25-01-PLAN.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 21 P01 | 4min | 3 tasks | 6 files |
| Phase 21 P02 | 6min | 1 tasks | 1 files |
| Phase 21 P03 | 4min | 3 tasks | 5 files |
| Phase 21 P04 | 10m | 2 tasks | 2 files |
| Phase 22 P01 | 4min | 4 tasks | 4 files |
| Phase 22 P02 | 3min | 2 tasks tasks | 2 files files |
| Phase 22 P03 | 9min | 2 tasks | 2 files |
| Phase 22 P04 | 12 min | 2 tasks | 1 files |
| Phase 22 P05 | ~9 min | 2 tasks | 0 files (verification-only gate) |
| Phase 23 P01 | ~14 min | 3 tasks | ~13 files (#7 sync + featured/order + D-15 chat-skip) |
| Phase 23 P02 | ~2 min | 2 tasks | 6 files (site-side content gates) |
| Phase 23 P03 | ~9 min | 3 tasks | 4 files (two-tier featured UI) |
| Phase 23 P04 | ~6 min | 2 tasks | 0 files (capstone gate + human sign-offs) |
| Phase 23 P01 | 14min | 3 tasks | 11 files |
| Phase 23 P02 | 2min | 2 tasks | 6 files |
| Phase 23 P03 | ~9min | 3 tasks | 4 files |
| Phase 23 P04 | ~6min | 2 tasks | 0 files (verification-only capstone gate) |
| Phase Phase 24 PP01 | 4min | 2 tasks tasks | 5 files files |
| Phase 24 P02 | 8min | 3 tasks | 3 files |
| Phase 24 P03 | 6min | 2 tasks | 3 files |
| Phase 24 P04 | 1min | 3 tasks | 5 files |
