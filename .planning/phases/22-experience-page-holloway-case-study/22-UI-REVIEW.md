# Phase 22 — UI Review

**Audited:** 2026-07-09
**Baseline:** 22-UI-SPEC.md (design contract) + design-system/MASTER.md (locked visual contract)
**Screenshots:** captured 2026-07-09 via Playwright-MCP against `astro dev` (:4321) — `/experience` and `/experience/holloway` at 1440px and 375px (see Automated UI Verification section). Initial code-only pass supplemented with a live render pass that resolves the two screenshot-pending gaps.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All copy strings match the contract verbatim; zero em dashes; company normalization (D-08) confirmed in frontmatter |
| 2. Visuals | 4/4 ▲ | Tier differentiation is type-register-only (no divider/border beyond the `EARLIER` hairline) — **now visually verified**: Holloway reads as a rich featured block, Balfour as a quiet muted entry, tier boundary legible at both 1440px and 375px (was 3/4 pending a screenshot) |
| 3. Color | 4/4 | Zero hardcoded colors/hex/rgb in either new page; accent confined to the contractually-reserved links + focus rings; **live render confirms no accent bleed onto body/tagline text** |
| 4. Typography | 4/4 | Only contract-listed role classes used (`.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`); h3 prose subhead reuses body ramp per frontend-design ruling, no new size introduced |
| 5. Spacing | 4/4 ▲ | All numeric spacing values map onto the MASTER scale (8/12/16/24/28/48); **the flagged SectionHeader→featured compounding-margin risk is disproven** — adjacent vertical margins collapse to 24px (not 48px) and the live render shows a clean single-step gap (was 3/4 pending a screenshot) |
| 6. Experience Design | 3/4 | Focus rings and hover states present; live pass adds positive evidence (active-nav accent underline renders, no console errors, EXP-05 404 gate confirmed live). Held at 3/4: MASTER.md's own nav contract (§5.1, v1.1) was never updated to reflect the new 4-item nav, leaving a stale spec vs. implementation drift |

**Overall: 23/24** _(revised from 21/24 after the Playwright verification pass resolved the two screenshot-pending pillar deductions)_

---

## Top 3 Priority Fixes

1. **MASTER.md nav contract left stale at 3 links** — a future contributor reading `design-system/MASTER.md` §5.1/§637 will see a 3-link nav spec that no longer matches the shipped 4-link `experience · works · about · contact` order, risking a regression if MASTER.md is ever used as the sole reference for a rebuild — update MASTER.md's nav section to document the 4-item order (or add an explicit "superseded by Phase 22" addendum) so the locked contract stays truthful.
2. **~~No screenshot verification of the asymmetric two-tier claim~~ — RESOLVED (2026-07-09)** — the core visual differentiator (D-04: Holloway "rich" vs Balfour "light") was screenshot-verified this session against `astro dev` at 1440px and 375px. The tier boundary reads clearly: Holloway is a rich featured block (large `.h2-project` title + `.lead` summary + ledger-ruled highlights + accent case-study link), Balfour a quiet all-muted `.meta-mono`/`--ink-muted` entry below the `EARLIER` hairline. Legible at both breakpoints; no remaining action.
3. **Detail-page `description` fallback chain has an unused branch** — `entry.data.description ?? entry.data.summary` in `src/pages/experience/[id].astro:29` depends on an optional Zod field (`description?: string`). NOTE: `holloway.mdx:19` *does* set `description`, so for the only built detail route the left branch is taken (verified `<title>`/meta render correctly); the `?? summary` fallback is exercised by no current entry, so it remains an untested path for any future case-study entry that omits `description`. Low priority — add a test or a comment if the fallback is meant to matter.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `src/pages/experience.astro:44` meta description matches the UI-SPEC line 103 verbatim, including the required en dash (not em dash).
- `experience.astro:66` "Read the full case study" + arrow matches D-05/spec line 104 exactly.
- `src/pages/experience/[id].astro:35,62` "Back to experience" (with leading `←`) matches spec line 113's recommended wording at both top and bottom instances, confirmed by 22-05's built-HTML count (exactly 2×).
- `holloway.mdx` frontmatter `company: "Holloway Company"` confirmed normalized per D-08 (no leading "The").
- Zero `—` (em dash, U+2014) found across `experience.astro`, `[id].astro`, `holloway.mdx`, `balfour-beatty.mdx` — voice contract held.
- Nav label `experience` (lowercase, uppercased via CSS) confirmed first in both `Header.astro:24` and `MobileMenu.astro:39`.

### Pillar 2: Visuals (4/4 — revised ▲)
- Featured/Earlier tiers differentiated by class (`.featured-*` vs `.earlier-*`) using `.h2-project`/`.lead`/`.body` for Holloway and pure `.meta-mono`/`--ink-muted`/`--ink-faint` for Balfour — structurally sound per the D-04 "type register, not decoration" ruling.
- No icon-only buttons; the only glyphs (`→`, `←`) are always paired with visible label text (`aria-hidden="true"` on the glyph, not the label) — correct accessible pattern.
- **Gap CLOSED (live render, 2026-07-09):** the asymmetric two-tier read was confirmed by screenshot at 1440px and 375px. The two tiers are unmistakably distinct — Holloway occupies a tall rich block (title register + lead-size summary + a five-item hairline-ruled ledger + the accent case-study link), while Balfour drops to a compact all-mono/muted register with no title and no affordance, cued by the `EARLIER` label + hairline rule. The pure-type-register differentiation works: no decoration needed. Upgraded 3 → 4.

### Pillar 3: Color (4/4)
- `grep` for `#[0-9a-fA-F]`/`rgb(`/arbitrary bracket values across both new page files returned zero matches — no hardcoded colors.
- Accent (`--accent`) usage confined to: `.deep-link:hover/:focus-visible` (experience.astro), `.back-link:hover/:focus-visible` (both instances, [id].astro), `.prose-editorial :global(a)` — all four are contractually reserved uses per UI-SPEC lines 84-89. No accent found on the Balfour entry, dividers, or "Earlier" label (confirmed `--ink-faint`/`--ink-muted` only) — matches the "Accent NEVER on" list at spec line 91.

### Pillar 4: Typography (4/4)
- Role classes used: `.h1-section` (deep-dive H1), `.h2-project` (featured title), `.lead` (both taglines), `.body`/`.label-mono`/`.meta-mono` — all match the spec's Typography table exactly; no ad-hoc `text-*`/inline `font-size` found outside the mapped roles.
- New h3 prose subhead intentionally stays on the `.body` ramp (1.125rem/500) rather than introducing a new size, per the frontend-design ruling recorded in 22-04's SUMMARY — consistent with the "no ad-hoc sizes" constraint.

### Pillar 5: Spacing (4/4 — revised ▲)
- Verified values against the MASTER scale (8/12/16/24/28/48): `.featured-eyebrow` 12px, `.featured-title` 8px, `.featured-stack` 24px, `.featured-summary`/`.highlights` 28px/24px, `.highlight` padding 16px, `.earlier-divider` 48px/24px, `.back-top` 24px, `.back-bottom` 48px, prose `h3` 28px/8px, `hr` 48px — all on-scale.
- **Compounding-margin risk DISPROVEN:** `.featured { margin-top: 24px; }` sits directly below the `SectionHeader` (bottom margin `lg` 24px). These are adjacent in-flow block siblings, so their vertical margins **collapse** to `max(24, 24) = 24px` — they do not sum to 48px. The 1440px render confirms a clean single-step gap between the section rule and the Holloway meta line, exactly one scale step. (The auditor's summary-table mention of "two hardcoded off-scale exceptions" is not borne out by the detailed value list above — no off-scale values were actually identified; treat that phrase as an over-cautious note superseded by this pass.)
- Upgraded 3 → 4: every value is on-scale and the only flagged risk resolves cleanly under CSS margin-collapse and in the live render.

### Pillar 6: Experience Design (3/4)
- Focus rings present and consistent: `outline: 2px solid var(--accent); outline-offset: 2px` on `.deep-link` and `.back-link` — matches the phase's stated reconciliation (spec line 135's flagged offset inconsistency was resolved to 2px everywhere, confirmed by 22-04's SUMMARY).
- `prefers-reduced-motion` handled on both pages (arrow-reveal disabled on experience.astro, transition removed on [id].astro) — good coverage for a static, no-loading-state page (correctly N/A per spec).
- EXP-05 structural exclusion **re-confirmed live**: `curl /experience/balfour-beatty` → `404`, `/experience/holloway` → `200`; the live `/experience` HTML contains **zero** `balfour-beatty` references (only `/experience` and `/experience/holloway` links), so Balfour is genuinely non-linked and its route correctly does not exist.
- Active-nav accent underline renders correctly on `/experience` and `/experience/holloway` (EXPERIENCE first in the 4-item nav, underlined), confirmed in both desktop screenshots.
- No console errors on either page during the render pass (one stale `balfour-beatty` 404 appeared only in a pre-existing browser tab from before navigation, not from either shipped page).
- **Gap (held at 3/4):** `design-system/MASTER.md`'s own nav contract was not updated to reflect the new 4-link order — this is a "living contract" hygiene issue, not a runtime defect, but it means the locked spec now understates what's actually shipped, which will mislead the next contributor or the next `gsd-ui-phase` run that treats MASTER.md as ground truth. This is the sole remaining action and is why the pillar is not 4/4.

---

## Automated UI Verification (Playwright-MCP)

Live render pass against `astro dev` (`http://localhost:4321`), 2026-07-09. Full-page screenshots captured at two breakpoints per surface; a native-scale hero crop was used to disambiguate a suspected color issue.

| Surface | Breakpoint | Screenshot | Result |
|---------|-----------|-----------|--------|
| `/experience` (listing) | 1440px | `phase22-exp-listing-1440.png` | Two-tier read confirmed; nav 4-item order + active underline correct |
| `/experience` (listing) | 375px | `phase22-exp-listing-375.png` | Layout holds; hamburger nav; tier split still legible single-column |
| `/experience/holloway` (detail) | 1440px | `phase22-holloway-detail-1440.png` | H1 + lead tagline + `§` mono section markers + numbered h3 highlights render per spec |
| `/experience/holloway` (detail) | 375px | `phase22-holloway-detail-375.png` | Full case study reflows to a clean single column |
| `/experience/holloway` hero | 1440px (device scale) | `phase22-holloway-hero-zoom.png` | Tagline is uniform `--ink` — no accent bleed |

Screenshots saved under `.playwright-mcp/` (git-untracked; not committed).

**Dimension/color/layout checks:**
- **Color — false alarm cleared:** the downscaled full-page image *appeared* to show accent-red spans mid-paragraph in the detail tagline/blockquote. A native-scale hero crop plus source review (`holloway.mdx` body contains no markdown links; `.project-tagline { color: var(--ink); }`; `:global(a)` accent rule matches nothing) confirmed the text is uniform ink. The apparent red was JPEG/downscale artifacting, **not** a color-contract violation. No finding.
- **Layout — tier boundary:** verified legible at both breakpoints (see Pillar 2).
- **Spacing — margin collapse:** verified clean single-step gap under the section header (see Pillar 5).
- **Structural gate:** `/experience/balfour-beatty` → 404, no link to it in the live DOM (see Pillar 6).

**Needs human review (brand feel / judgment):**
- The `EARLIER` divider treatment (quiet mono label + hairline) and the overall "featured vs earlier" weight ratio read well to this audit, but the tier-weight balance is ultimately a frontend-design/brand-feel call (SC5). No objection raised; flagging as the one item resting on taste rather than a measurable contract.

## Files Audited
- `src/pages/experience.astro`
- `src/pages/experience/[id].astro`
- `src/components/primitives/Header.astro`
- `src/components/primitives/MobileMenu.astro`
- `src/content/experience/holloway.mdx` (frontmatter)
- `src/content/experience/balfour-beatty.mdx`
- `src/content.config.ts` (experience schema, description field check)
- `.planning/phases/22-experience-page-holloway-case-study/22-UI-SPEC.md`
- `.planning/phases/22-experience-page-holloway-case-study/22-CONTEXT.md`
- `.planning/phases/22-experience-page-holloway-case-study/22-0{1..5}-SUMMARY.md`
