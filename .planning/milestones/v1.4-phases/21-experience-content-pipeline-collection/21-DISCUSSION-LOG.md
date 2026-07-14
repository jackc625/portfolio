# Phase 21: Experience Content Pipeline & Collection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 21-experience-content-pipeline-collection
**Areas discussed:** Schema fields & types, Ordering & date model, Balfour Beatty source, Body / prose contract, CI / build wiring, Fence markers & content boundary, Discretion-call revisit (chatSummary, highlights)

---

## Schema fields & types

| Option | Description | Selected |
|--------|-------------|----------|
| Rich + forward-compatible | Add `engagementType` enum, `hasCaseStudy` boolean, first-person `summary`, third-person `chatSummary`. No later schema change for Phases 22 & 25. | ✓ |
| Minimal now | role/company/dates/tech + `summary` only; add flags & `chatSummary` later. | |
| You decide | Defer field list to Claude. | |

**User's choice:** Rich + forward-compatible
**Notes:** Explicitly to avoid a schema edit later in the milestone. Later refined: `chatSummary` optional + deferred content; `highlights: string[]` included (see revisit section).

---

## Ordering & date model

| Option | Description | Selected |
|--------|-------------|----------|
| Sortable dates | `startDate`/`endDate` via `z.coerce.date()`; sort `startDate` desc; separate `dateRange` display string. Idiomatic, self-maintaining. | ✓ |
| Explicit `order: number` | Mirror the projects collection's manual integer field. | |
| You decide | Defer to Claude. | |

**User's choice:** Sortable dates
**Notes:** Grounded in current Astro docs (`z.coerce.date()` + `.valueOf()` descending sort). Holloway (May 2026) → Balfour (May 2023) sorts naturally deep-dive-first.

---

## Balfour Beatty source

| Option | Description | Selected |
|--------|-------------|----------|
| Author lightweight stub now | Create `Experience/BALFOUR_BEATTY.md` (role/dates/1–2 lines) from résumé facts; validates as 2nd entry, satisfies SC1. | ✓ |
| Holloway-only for now | Build pipeline against Holloway alone; Phase 22 authors Balfour. Narrows SC1. | |
| You decide | Defer to Claude. | |

**User's choice:** Author lightweight stub now
**Notes:** Facts pulled from `public/jack-cutrara-resume.pdf` — Project Management Intern, Chantilly VA, May 2023 – Aug 2023 (non-engineering; `techStack: []`, `hasCaseStudy: false`).

---

## Body / prose contract

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror mechanism, relax shape | Reuse fenced-block extraction + idempotent `--check`; drop the 5-H2 / 600–900-word checks; carry full Holloway prose as MDX body. | ✓ |
| Metadata-only for Phase 21 | Frontmatter + short summary only; defer Holloway deep-dive body to Phase 22. | |
| You decide | Defer to Claude. | |

**User's choice:** Mirror mechanism, relax shape
**Notes:** Holloway (Overview + 9 Highlights + Themes) and Balfour (1–2 lines) don't fit the projects case-study mold, so the projects-specific validation is dropped for experience.

---

## CI / build wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Separate scripts + CI step | `sync:experience` / `sync:experience:check` npm scripts + new paths & a verify step in `sync-check.yml`. Mirrors projects; drift gates independent. | ✓ |
| Combined drift gate | Generalize `sync:check` to run both collections in one command/step. | |
| You decide | Defer to Claude. | |

**User's choice:** Separate scripts + CI step
**Notes:** Confirmed the projects sync is NOT in `build` — it's a manual `pnpm sync:projects` + CI drift gate (`sync-check.yml`). Experience preserves that pattern (not hooked into `build`).

---

## Fence markers & content boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse CASE-STUDY markers, wrap Overview→Themes | Same `<!-- CASE-STUDY-START/END -->` strings; Holloway fence wraps everything below the H1; Balfour wraps its 1–2 lines. | ✓ |
| Experience-specific markers | `<!-- EXPERIENCE-START/END -->` for cleaner semantics; same boundary. | |
| You decide | Defer to Claude. | |

**User's choice:** Reuse CASE-STUDY markers, wrap Overview→Themes
**Notes:** Fence markers must be *added* to `Experience/*.md` (Holloway currently has none).

---

## Discretion-call revisit — chatSummary

| Option | Description | Selected |
|--------|-------------|----------|
| Optional, defer content to Phase 25 | Field exists now (no later schema change); third-person copy authored in Phase 25 after positioning finalizes. | ✓ |
| Required, author third-person now | Write `chatSummary` for both entries in Phase 21. Risks rework after Phase 24 positioning shift. | |
| You decide | Defer to Claude. | |

**User's choice:** Optional, defer content to Phase 25

---

## Discretion-call revisit — highlights

| Option | Description | Selected |
|--------|-------------|----------|
| Include `highlights: string[]` | 3–5 typed headline bullets in frontmatter; serves EXP-06 "at a glance" + Phase 22 scannable summary. | ✓ |
| Omit it | Phase 22 pulls highlights from MDX prose instead. | |
| You decide | Defer to Claude. | |

**User's choice:** Include `highlights: string[]`

---

## Claude's Discretion

- Exact Zod types/refinements, optionality edges, enum literal spelling (within the agreed field list).
- Collection file slugs/filenames and internal script structure (within the mirror decision).
- Whether to retain any relaxed soft-warning in the sync script.
- Balfour date precision (month `2023-05` vs full ISO) — either sorts correctly.

## Deferred Ideas

- Third-person `chatSummary` content → Phase 25 (CHAT-10/11).
- Balfour full case study → out of scope (EXP-FUT-01).
- Metrics/impact visualizations for highlights → deferred (EXP-FUT-02).
- Company logo / thumbnail image field → not added (Holloway confidential; add later if a visual treatment needs it).
- Reviewed-but-not-folded todos (og-default.png, chat cache observability, mobile-menu breakpoint, CHAT_RATE_LIMITER binding) — all out of Phase 21 scope; belong to UI phases 22–24 or stand alone.
