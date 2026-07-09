# Phase 21: Experience Content Pipeline & Collection - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a typed, Zod-validated `experience` content collection, fed from `Experience/*.md` through a **new** sync script (`scripts/sync-experience.mjs`) that mirrors the established `scripts/sync-projects.mjs` mechanism. This phase establishes the field + reverse-chronological ordering contract that the Phase 22 Experience page will render against.

**In scope (EXP-01, EXP-06):**
- A new `experience` collection registered in `src/content.config.ts` with a rich Zod schema.
- A `sync-experience.mjs` script (fenced-block extraction, idempotent `--check`) + npm scripts + CI drift gate.
- Two entries populated: Holloway (full deep-dive body) and a newly-authored lightweight Balfour Beatty stub.
- Reverse-chronological ordering by real dates; `astro check` + `pnpm build` pass with the collection wired in.

**Explicitly NOT in scope (belongs to later phases):**
- The Experience **page**, route, nav entry, or any UI/layout → Phase 22.
- Rendering the scannable summary or the Holloway detail view → Phase 22.
- Wiring experience content into chat / `portfolio-context.json` → Phase 25.
- Authoring third-person `chatSummary` **content** → Phase 25 (the *field* is defined here; it stays empty/optional).
- No new runtime dependencies (standing v1.2+ constraint).
</domain>

<decisions>
## Implementation Decisions

### Schema (rich, forward-compatible)
- **D-01:** The `experience` schema is intentionally rich so Phases 22 & 25 need **no later schema change**. Intended fields (planner finalizes exact Zod types):
  - `role` (string), `company` (string), `location` (string)
  - `startDate` (`z.coerce.date()`), `endDate` (`z.coerce.date().optional()` — absence ⇒ current/present)
  - `dateRange` (string, display-only, e.g. `"May 2026 – Present"`) — kept **separate** from the sortable dates
  - `techStack` (`z.array(z.string())`) — may be empty for the non-engineering Balfour entry
  - `summary` (string, **first-person** site voice — scannable, factual about the work, safe to author now)
  - `highlights` (`z.array(z.string())`, 3–5 headline bullets) — typed frontmatter, not prose-parsed
  - `engagementType` (enum: `"contract" | "internship"`)
  - `hasCaseStudy` (boolean — Holloway `true`, Balfour `false`)
  - `chatSummary` (**optional**, third-person) — field defined now, content deferred to Phase 25
  - `source` (string, path to the `Experience/*.md` source; existence validated by the sync script, not Zod — matches the projects D-15 pattern)
- **D-02:** `chatSummary` is **optional** and its content is **deferred to Phase 25**. Rationale: the field satisfies "rich + forward-compatible" (no schema edit in Phase 25), but authoring third-person chat copy now would be premature — Phase 25 regenerates chat knowledge only after Phase 24 finalizes the new-grad positioning, so writing it now risks rework. Keeping it optional means Phase 21 builds green with the field empty.
- **D-03:** `highlights: string[]` is **included** as typed frontmatter (3–5 bullets). Serves EXP-06's "at a glance" and Phase 22's scannable summary as structured, typed data rather than prose extraction.

### Ordering & date model (EXP-06)
- **D-04:** Reverse-chronological ordering is driven by **real sortable dates**, not a manual `order: number`. Use `z.coerce.date()` for `startDate`/`endDate`; the collection query sorts by `startDate` **descending** (idiomatic Astro: `a.data.startDate.valueOf()` comparison). This is self-maintaining and honest — no manual renumbering.
- **D-05:** A separate `dateRange` display string carries the human-readable label (`"May 2026 – Present"`, `"May 2023 – Aug 2023"`), decoupling render text from sort keys. With Holloway (May 2026) → Balfour (May 2023), reverse-chron naturally yields deep-dive-first, lightweight-second.

### Sync mechanism & body/prose contract
- **D-06:** A **new** `scripts/sync-experience.mjs` **mirrors the `sync-projects.mjs` mechanism** — fenced-block extraction, frontmatter preserved byte-for-byte, LF normalization, path-traversal guard, idempotent diff-then-write, `--check` mode exiting 1 on drift (per STATE.md: "do not invent a new mechanism"). It is a parallel script, not a refactor of the projects script.
- **D-07:** **Drop the projects-specific validation shape.** The projects script enforces a 5-H2 shape (`Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings`) and a 600–900-word target. Experience content does not fit that mold (Holloway = Overview + 9 Highlights + Themes; Balfour = 1–2 lines), so those checks are **removed** for experience. Word-count/H2 shape checks are not carried over (or are relaxed to a no-op) — planner decides whether any soft signal is worth keeping.
- **D-08:** **Reuse the same fence markers** `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->` for mechanism parity. Fence markers must be **added** to `Experience/*.md` (Holloway currently has none). The Holloway fence wraps **everything below the H1 title** (Overview → Highlights → Themes) — the full deep-dive body Phase 22 renders. Balfour's fence wraps its 1–2 lines.
- **D-09:** Sources live at `Experience/*.md`; collection files at `src/content/experience/*.mdx` (mirroring `src/content/projects/*.mdx`). Suggested slugs: `holloway.mdx`, `balfour-beatty.mdx` (builder discretion).

### Balfour Beatty source
- **D-10:** **Author a lightweight `Experience/BALFOUR_BEATTY.md`** during execution so Phase 21 validates **both** entries (satisfies SC1's "Holloway, Balfour Beatty"). Content drawn verbatim-ish from the résumé (see Specific Ideas). `engagementType: internship`, `hasCaseStudy: false`, `techStack: []` (non-engineering PM internship). Fenced block wraps the 1–2 line description.

### CI / build wiring
- **D-11:** **Separate scripts + CI step** (mirror projects exactly; drift gates stay independent and legible):
  - Add npm scripts `sync:experience` (`node scripts/sync-experience.mjs`) and `sync:experience:check` (`... --check`).
  - Add to `.github/workflows/sync-check.yml`: the paths `Experience/**`, `src/content/experience/**`, `scripts/sync-experience.mjs`, plus a "Verify Experience sync is clean" step running `pnpm sync:experience:check`.
  - Do **not** add the sync to the `build` script — projects sync isn't in `build` either; it's a manual `pnpm sync:*` + CI drift gate. Preserve that pattern.

### Claude's Discretion
- Exact Zod types/refinements, optionality edges, and enum literal spelling for the schema (within the D-01 field list).
- Collection file slugs/filenames and internal script structure (within the D-06/D-09 mirror decision).
- Whether to keep any relaxed soft-warning in the sync (D-07).
- Whether Balfour's `startDate`/`endDate` use month precision (`2023-05` / `2023-08`) vs full ISO dates — either sorts correctly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The pattern to mirror (authoritative — do not invent a new mechanism)
- `scripts/sync-projects.mjs` — the sync mechanism being paralleled: fenced-block extraction, frontmatter-preserving diff-then-write, `--check` drift mode, path-traversal guard, exit-code contract. Copy the mechanism; strip the 5-H2 / word-count validation.
- `src/content.config.ts` — the existing `projects` collection schema the `experience` schema parallels (note: `featured`/`order`/`z.coerce`-style patterns; `source:` field validated by script not Zod).
- `docs/CONTENT-SCHEMA.md` — content schema + sync failure-mode documentation (referenced by `sync-projects.mjs` header, D-17 §4). Update to document the experience pipeline.
- `.github/workflows/sync-check.yml` — the CI drift gate to extend with experience paths + a check step.

### Requirements & scope
- `.planning/ROADMAP.md` — Phase 21 goal + Success Criteria (SC1–SC4); v1.4 phase sequencing (21→22→23→24→25).
- `.planning/REQUIREMENTS.md` — EXP-01, EXP-06 (this phase); EXP-02..05 (Phase 22, the downstream consumer of this contract); Out-of-Scope table.
- `.planning/STATE.md` §Accumulated Context — roadmap-level notes: "mirror sync-projects.mjs," projects schema already supports featuring, chat #7 exclusion, voice-split guard.

### Content sources
- `Experience/HOLLOWAY_EXPERIENCE.md` — the one existing source (Overview + 9 Highlights + Themes). Fence markers to be added; full body below H1 becomes the MDX body.
- `public/jack-cutrara-resume.pdf` — authoritative facts for dates/roles/stack (Holloway May 2026–Present; Balfour May 2023–Aug 2023) and source of the Balfour stub content.

### Voice split (relevant to the deferred chatSummary field, enforced in Phase 25)
- `docs/VOICE-GUIDE.md` — first-person (site) vs third-person (chat) contract; governs `summary` (first-person, authored now) vs `chatSummary` (third-person, Phase 25).
- `scripts/build-chat-context.mjs` — where `chatSummary` is consumed and `checkFirstPersonLeaks` runs (Phase 25 concern; noted so the schema's `chatSummary` field is shaped compatibly).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/sync-projects.mjs`: exported pure functions (`readSourceField`, `sliceFrontmatter`, `extractFence`, `wordCount`, `checkH2Shape`, `normalize`) — `sync-experience.mjs` can lift `readSourceField`, `sliceFrontmatter`, `extractFence`, and `normalize` near-verbatim; omit/relax `checkH2Shape` + word-count (D-07).
- `src/content/projects/seatwatch.mdx` (and siblings): the frontmatter template shape to parallel for experience `.mdx` files, including the `source:` field convention.
- `.github/workflows/sync-check.yml`: existing drift-gate job to extend (add paths + one `pnpm sync:experience:check` step).

### Established Patterns
- **Source-of-truth split:** metadata lives in `src/content/<collection>/*.mdx` frontmatter; prose lives in a fenced block in the human-authored source (`Projects/*.md` → `Experience/*.md`); the sync copies fence→body and preserves frontmatter byte-for-byte.
- **Manual sync + CI gate (not build-time):** `build` does *not* run the sync; contributors run `pnpm sync:*` and CI enforces no-drift via `--check`. Experience must follow this, not hook into `build`.
- **`z.coerce.date()` + descending sort** is the idiomatic Astro approach for reverse-chronological collections (confirmed against current Astro docs).
- **Zod strips unknown keys:** the projects `.mdx` carries a `chatSummary` not present in the collection schema — it's read directly by the chat builder. For experience we deliberately *add* `chatSummary` to the schema (optional) so it's typed.

### Integration Points
- `src/content.config.ts` — register the new `experience` collection alongside `projects` in the exported `collections` object.
- `package.json` scripts — add `sync:experience` + `sync:experience:check` (parallel to `sync:projects` / `sync:check`).
- `.github/workflows/sync-check.yml` — add experience paths + a verify step.
- Phase 22 will `getCollection("experience")`, sort by `startDate` desc, and render summary/highlights/detail — this phase defines that contract.

</code_context>

<specifics>
## Specific Ideas

**Authoritative facts (from `public/jack-cutrara-resume.pdf`):**

- **Holloway Company** — *Software Engineer, Contract* · Northern Virginia · **May 2026 – Present**
  - Stack: JavaScript, TypeScript (Deno), React 18, TanStack Query, Base44 BaaS, Vitest, GitHub Actions CI
  - `engagementType: contract`, `hasCaseStudy: true`. Full body sourced from `Experience/HOLLOWAY_EXPERIENCE.md`.
  - Candidate `highlights` (headline bullets, from the source's "Themes at a glance"): 0→~1,400 tests with money/time math pinned to the penny; RLS across 47 entities + portal scoping fix (223→1 jobs); recovered 91 wrongly-archived production jobs; idempotent geofenced payroll time-clock; consolidated data-access layer killing silent truncation/cache-collision bugs. (Planner/author picks 3–5.)

- **Balfour Beatty** — *Project Management Intern* · Chantilly, VA · **May 2023 – Aug 2023**
  - `engagementType: internship`, `hasCaseStudy: false`, `techStack: []`.
  - Lightweight body (1–2 lines) to author from the résumé bullets: "Tracked deliverables and subcontractor timelines across active construction workstreams; coordinated with engineers, subcontractors, and clients to keep multi-phase milestones on schedule. Led stakeholder meetings and prepared status reports for project leadership."

**Ordering sanity check:** Holloway (2026) sorts above Balfour (2023) under `startDate` desc — matches the intended deep-dive-first, lightweight-second presentation.

</specifics>

<deferred>
## Deferred Ideas

- **Third-person `chatSummary` content** — field defined here (optional); content authored in **Phase 25** after positioning finalizes (CHAT-10/11).
- **Balfour full case study** — explicitly out of scope (EXP-FUT-01); lightweight entry only.
- **Metrics/impact visualizations** for experience highlights (0→1,400, 223→1) — deferred (EXP-FUT-02) until the text format proves out.
- **Company logo / thumbnail image field** — not added; Holloway is confidential/internal, no public asset. Add later if a visual treatment needs it.

### Reviewed Todos (not folded)
Four todos keyword-matched Phase 21 but none touch a content collection or sync pipeline — all reviewed and **not folded** (belong to UI phases 22–24 or stand alone):
- *"Design and ship a real og-default.png"* — UI/OG asset; belongs to a UI phase, not the content pipeline.
- *"Chat cache-hit-rate observability"* — chat instrumentation; adjacent to Phase 25 or standalone.
- *"Change mobile menu breakpoint 380px→768px"* — UI; unrelated to Phase 21.
- *"Configure CHAT_RATE_LIMITER Cloudflare binding"* — infra; unrelated to Phase 21.

</deferred>

---

*Phase: 21-experience-content-pipeline-collection*
*Context gathered: 2026-07-08*
