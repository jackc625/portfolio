---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Professional Experience
current_phase: 21
current_phase_name: experience-content-pipeline-collection
status: executing
stopped_at: Completed 21-02-PLAN.md
last_updated: "2026-07-09T08:51:46.528Z"
last_activity: 2026-07-09
last_activity_desc: Phase 21 execution started
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 4
  completed_plans: 3
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-08)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** Phase 21 — experience-content-pipeline-collection

## Current Position

Phase: 21 (experience-content-pipeline-collection) — EXECUTING
Plan: 4 of 4
Status: Ready to execute
Last activity: 2026-07-09 — Phase 21 execution started
Progress: [░░░░░░░░░░] 0% (0/5 phases)

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

### Open Blockers

(none — v1.4 roadmap approved; ready to plan Phase 21)

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

**Last session:** 2026-07-09T08:51:14.181Z
**Stopped at:** Completed 21-02-PLAN.md
**Resume file:** .planning/phases/21-experience-content-pipeline-collection/21-01-PLAN.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 21 P01 | 4min | 3 tasks | 6 files |
| Phase 21 P02 | 6min | 1 tasks | 1 files |
| Phase 21 P03 | 4min | 3 tasks | 5 files |
