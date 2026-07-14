# Phase 23 — UI Review

**Audited:** 2026-07-10
**Baseline:** 23-UI-SPEC.md (extends design-system/MASTER.md v1.1 LOCKED)
**Screenshots:** captured (phase23-projects-1440.png, phase23-projects-375.png, phase23-home-1440.png, phase23-home-375.png, plus uat23-* captures reviewed for corroboration)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Taglines render verbatim, ≤80 chars, one line at desktop; tier labels/see-all copy match contract exactly; zero em dashes in new copy. |
| 2. Visuals | 4/4 | Three-step type ladder (title/tagline/stack) reads cleanly at both breakpoints; tier asymmetry legible in a 30-second scan; no icons, no cards, editorial ledger preserved. |
| 3. Color | 4/4 | Six-token palette only, no hardcoded hex/rgb in touched files; accent confined to interactive affordances (hover/focus underline, arrow, see-all link); tagline correctly stays `--ink-muted` with no hover color change. |
| 4. Typography | 3/4 | Featured-row ladder matches spec (`.h2-project`→`.body`→mono stack) exactly, but the reused `SectionHeader` primitive stacks `label-mono` and `h1-section` on the same element and renders `§ 01 · WORK` (middot) instead of the contract's literal `§ 01 — WORK` — a pre-existing drift this phase didn't introduce but that the UI-SPEC's own worked example (line 101, 125) shows as em-dash form. |
| 5. Spacing | 4/4 | Title→tagline 8px, tagline→stack 12px, tier-divider 48px break, row padding 28px — all read correctly in code and match the rendered screenshots; no arbitrary values found. |
| 6. Experience Design | 3/4 | Continuous 01→07 numbering and static-content model are correctly handled (no loading/empty state needed, confirmed appropriate); but the WR-01 finding already on record (Home row numbers derived by re-deriving `order` per row rather than a single canonical index) is a state-integrity risk that lives exactly in this UI's data-binding layer and belongs in this pillar's evidence trail even though it's not "new." |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **`SectionHeader.astro` renders `§ 01 · WORK` (middot) instead of the em-dash form the UI-SPEC's own copy table specifies (`§ 01 — WORK`)** — Recruiters scanning `/projects` and Home see a punctuation mismatch against the documented contract; low user-impact but it is a literal spec violation surfaced by this audit. Fix: either update `SectionHeader.astro` line 25 separator to `—` (if project truly wants em dash there) or update UI-SPEC.md's copy table to reflect the intentional middot (if the middot was a deliberate later change from a prior phase) — needs a decision, not a blind edit, since CLAUDE.md's site-wide em-dash ban may make the middot the *correct* choice and the UI-SPEC text the stale artifact.
2. **`SectionHeader.astro` puts two type-role classes (`label-mono` + `h1-section`) on one span** — Violates the "every text element uses exactly one role class" rule stated in the UI-SPEC's Typography section (line 55). Pre-existing, not introduced by Phase 23, but this phase's contract explicitly restates the one-role-per-element rule, so its own reused primitive is out of compliance with the rule it cites. Fix: split into two elements or resolve to a single deliberate role.
3. **WR-01 (already logged): Home's featured-row numbering derives from `p.data.order` independently on both pages rather than a single shared derivation** — no visual break today (both pages currently agree), but a future content edit that adds/reorders a featured project without updating both partitions could desync the numbers users see between Home and `/projects`. Not a Phase-23 regression, but it is a live fragility in the exact code path this audit covers; recommend closing it in the next phase touching `src/content.config.ts` or the partition logic.

No BLOCKER-severity findings. All three items above are WARNING-level: they degrade contract fidelity or long-term robustness but do not break any user task on `/projects` or Home today.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `src/pages/projects.astro:33,50` — tier sub-labels render `Featured` / `More work`, CSS uppercases via `.label-mono` to `FEATURED` / `MORE WORK` exactly per contract.
- `src/pages/index.astro:72-75` — "See all work →" link text and placement (after work-list, before ABOUT) match D-13 exactly; screenshot confirms position.
- Taglines (`src/content/projects/*.mdx`) are all ≤ ~75 chars, first-person-neutral technical descriptions, zero em dashes, render verbatim via `p.data.tagline` (no template-authored copy).
- Section count `7 / 7` on `/projects`, `3 / 7` on Home — both confirmed in screenshots.
- No empty/error/destructive-confirmation copy needed and none present, consistent with the "not applicable" rows in the contract.

### Pillar 2: Visuals (4/4)
- Screenshots confirm the three-row FEATURED block reads distinctly heavier/richer than the four-row MORE WORK block due to the added tagline line alone — no card, icon, or color crutch used (MASTER §8 anti-card/anti-icon honored).
- Tier dividers (`FEATURED`/`MORE WORK`) sit clearly quieter (`--ink-faint`, smaller mono) than the black `§ 01 · WORK` section header, so they read as sub-tier markers not duplicate headers — matches the contract's stated intent.
- Mobile (375px) reflow: numbers, titles, taglines, and stack lines all wrap correctly with no overflow or collision; tier dividers still legible at narrow width.
- Continuous numbering 01→07 is visually unbroken across the tier gap — confirms the "numbered ledger stays honest" goal.

### Pillar 3: Color (4/4)
- Grep of `src/pages/index.astro`, `src/pages/projects.astro`, `WorkRow.astro`, `SectionHeader.astro` for hex/rgb literals returns zero hits — all color via CSS custom properties.
- Accent (`--accent` / `#E63946`) usage confirmed limited to: WorkRow title underline + arrow on hover/focus, "See all work" link hover, focus rings, wordmark dot, and the pre-existing status dot / chat FAB (all interactive, all outside this phase's scope but consistent with the "only if clickable" rule).
- Tagline (`.work-tagline`) confirmed to carry no hover rule in `WorkRow.astro` — stays `--ink-muted` at all times, exactly as the contract mandates ("tagline takes no hover color change").

### Pillar 4: Typography (3/4)
- Featured row ladder confirmed in code and screenshot: `.h2-project` (1.75rem/500/`--ink`) title → `.body` (1.125rem/400/`--ink-muted`) tagline → mono stack (0.8125rem/`--ink-faint`) — matches the contract's three-step ladder description precisely.
- `.work-title:has(+ .work-tagline)` correctly narrows the title→tagline gap to 8px only when a tagline is present, leaving rest-tier rows byte-identical to the pre-Phase-23 primitive (12px title→stack) — confirmed in `WorkRow.astro:76-87`.
- Deduction: `SectionHeader.astro:25` combines `label-mono` (0.75rem uppercase mono) and `h1-section` (clamp 2.5-3.5rem/600) on the same `<span>` — two type-role classes on one element, in direct tension with the UI-SPEC's own stated rule ("every text element uses exactly one role class — no ad-hoc sizes/weights"). This is inherited from before Phase 23 (not touched by this phase's diff) but the phase's own contract restates the rule its dependency violates, and the rendered `§ 01 · WORK` uses a middot where the UI-SPEC's copy table literally writes `§ 01 — WORK` in three places (lines 101, 125, 139 pattern) — a live mismatch between what ships and what the contract's own copy sample shows.

### Pillar 5: Spacing (4/4)
- `WorkRow.astro`: row `padding: 28px 0` unchanged both tiers; title→tagline `margin-bottom: 8px`, tagline→stack `margin-bottom: 12px` — both match the xs/sm tokens (8px/12px) in the Spacing Scale table exactly.
- `projects.astro`: `.tier-more { margin-top: 48px }` matches the 2xl token; `.tier-divider { gap: 12px }` matches sm token; `margin-bottom: 24px` on the divider matches lg token.
- No arbitrary bracket values (`[...px]`, `[...rem]`) found in any touched file.
- Home "See all work" link `margin-top: 24px` matches the lg token and mirrors `.read-more` exactly as specified.

### Pillar 6: Experience Design (3/4)
- Static content model correctly has no loading/error/empty states, and the contract's "not applicable" calls for those rows are honestly reflected in the implementation (no dead defensive code, no unreachable UI branches).
- Focus-visible rings and reduced-motion overrides are present and correctly paired in `WorkRow.astro` (arrow reveal suppressed, underline color-change retained per MASTER §6.2) and in the Home `.see-all-work` block — both tested states exist in code.
- Deduction: the already-logged WR-01 finding (Home derives row numbers by re-computing `p.data.order` per page rather than sharing one canonical source) is a state-derivation fragility that sits squarely in this phase's data-binding code (`index.astro:14-18`, `projects.astro:11-15`) — both currently agree, but nothing enforces that agreement beyond convention. Scored down one point because a UX-integrity guardrail (single derivation point, or a build-time assertion that both partitions produce matching numbers) is absent from the implementation the contract asked to reuse ("D-12: both pages derive from the same pipeline") — technically both *do* re-derive the same way, but as two independent call sites rather than one shared function, which is the exact shape of bug that produces silent Home/Projects desync later.

---

## Registry Safety

Not applicable — `components.json` does not exist; UI-SPEC explicitly declares "no shadcn/third-party registries" for this phase. Registry audit skipped per contract.

---

## Files Audited

- `.planning/phases/23-projects-reconciliation-featured-tier/23-UI-SPEC.md`
- `design-system/MASTER.md` (referenced for token/type/spacing verification)
- `src/pages/projects.astro`
- `src/pages/index.astro`
- `src/components/primitives/WorkRow.astro`
- `src/components/primitives/SectionHeader.astro`
- `src/content/projects/*.mdx` (all 7 — tagline, featured, order fields)
- `phase23-projects-1440.png`, `phase23-projects-375.png`, `phase23-home-1440.png`, `phase23-home-375.png` (rendered visual evidence)
