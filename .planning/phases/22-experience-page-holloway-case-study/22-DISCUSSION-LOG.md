# Phase 22: Experience Page & Holloway Case Study - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 22-experience-page-holloway-case-study
**Areas discussed:** Deep-dive routing, Back navigation, Nav placement + label, Summary card content, Page composition, Balfour framing, Deep-dive header + company name, Body fidelity, Metadata + JSON-LD boundary, Analytics parity

---

## Deep-dive routing

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic /experience/[id] | Mirror /projects/[id]; getStaticPaths filters hasCaseStudy===true (only Holloway builds, Balfour gets none); full MDX via .prose-editorial | ✓ |
| Hardcoded /experience/holloway | One static file, no getStaticPaths; diverges from projects pattern | |
| Inline expand on /experience | Disclosure on the Experience page, no separate route | |

**User's choice:** Dynamic /experience/[id]
**Notes:** Strongest reuse + forward-compatible; the schema's `hasCaseStudy` flag becomes the getStaticPaths filter.

---

## Back navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Back link, both ends | Mono "← Back to Experience" near the top AND in the NextProject slot at the bottom | ✓ |
| Bottom 'back' card only | Reuse NextProject card slot with a single back-pointing card | |
| Rely on header nav only | No dedicated back control | |

**User's choice:** Back link, both ends
**Notes:** NextProject card dropped (Holloway is the only case study).

---

## Nav placement + label

| Option | Description | Selected |
|--------|-------------|----------|
| experience · works · about · contact | Experience FIRST; serves v1.4 repositioning (POS-01) | ✓ |
| works · experience · about · contact | Experience second, after the projects anchor | |
| works · about · experience · contact | Experience near the narrative/about end | |

**User's choice:** experience · works · about · contact (experience first), label "experience"
**Notes:** Update both Header.astro and MobileMenu.astro; isActive startsWith("/experience") covers the [id] route.

---

## Summary card content

| Option | Description | Selected |
|--------|-------------|----------|
| Meta + summary line + all 5 highlights | role·company·dates·stack + first-person summary + 5 highlights + "Read the full case study →" | ✓ |
| Meta + all 5 highlights (no prose line) | Drop the summary sentence; bullets carry the story | |
| Meta + summary line + top 3 highlights | Show 3 highlights, save 2 for the deep-dive | |

**User's choice:** Meta + summary line + all 5 highlights
**Notes:** Dual-audience — metrics-laden highlights sell the 30-sec scan, link rewards the deep dive.

---

## Page composition

| Option | Description | Selected |
|--------|-------------|----------|
| Asymmetric two-tier | Holloway rich featured summary; Balfour lighter entry; split by hasCaseStudy | ✓ |
| Uniform treatment, content differs | Same shell for both; Balfour just has fewer fields | |
| Flat WorkRow list | Both as WorkRow rows like projects | |

**User's choice:** Asymmetric two-tier
**Notes:** Exact visual form finalized by the frontend-design skill (SC5).

---

## Balfour framing

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle 'Earlier' cue | Light mono label/divider framing Balfour as career context | ✓ |
| Continuous flow, de-emphasis only | No label; lighter second entry, visual hierarchy only | |
| Explicit section header | Full numbered "Earlier Experience" SectionHeader | |

**User's choice:** Subtle 'Earlier' cue
**Notes:** Non-linked (no case study); reverse-chron places it second.

---

## Deep-dive header + company name

| Option | Description | Selected |
|--------|-------------|----------|
| The Holloway Company (H1) | Company as headline | ✓ (amended) |
| Software Engineer, Contract (H1) | Role as headline | |
| Holloway Connect (H1) | Platform name as headline | |

**User's choice:** Company as H1 — but amended to **"Holloway Company"** (no "The").
**Notes:** Meta line = dateRange · stack; tagline = summary line; no external-links row (confidential contract).

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize everywhere | Update company frontmatter to "Holloway Company"; propagates to summary meta + H1 + downstream | ✓ |
| Only the H1 drops 'The' | Keep frontmatter "The Holloway Company"; H1 alone strips it | |

**User's choice:** Normalize everywhere
**Notes:** Safe from the CI drift gate — frontmatter is authored in the .mdx, not synced from the fenced source.

---

## Body fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Render verbatim, as authored | Full body (Overview + 9 highlights + Themes) via .prose-editorial exactly as synced | ✓ |
| Trim for the web | Shorten highlights; requires editing the source + re-sync | |

**User's choice:** Render verbatim
**Notes:** Content changes flow through Experience/HOLLOWAY_EXPERIENCE.md + re-sync, never a .mdx body hand-edit.

---

## Metadata + JSON-LD boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Basic title/description; defer JSON-LD | Per-page BaseLayout title + description only; JSON-LD Person/positioning → Phase 24 | ✓ |
| Add minimal structured data now | Per-page JSON-LD (CreativeWork/Article) in Phase 22 | |

**User's choice:** Basic title/description; defer JSON-LD to Phase 24 (POS-04)
**Notes:** Keeps the positioning shift in one place; avoids rework.

---

## Analytics parity

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror project detail | 4 scroll-depth sentinels on the deep-dive; no new event types; outbound moot | ✓ |
| No instrumentation on new pages | Skip scroll-depth entirely | |

**User's choice:** Mirror project detail
**Notes:** Internal summary→deep-dive nav stays untracked (same as project links).

---

## Claude's Discretion

- All final visual execution (layout, card/block form, spacing, type-scale, divider/label styling, the "Earlier" cue) → frontend-design skill against design-system/MASTER.md (SC5).
- Detail-page slug/param wiring (`holloway` → `/experience/holloway`).
- Whether the deep-dive intro blockquote is de-duplicated against the D-07 tagline.
- Reuse depth of Container / SectionHeader primitives on the new pages.

## Deferred Ideas

- Home Holloway teaser → Phase 24 (HOME-01).
- Positioning-shift copy + JSON-LD Person / positioning metadata → Phase 24 (POS-01..04).
- Experience content into chat knowledge + third-person chatSummary → Phase 25 (CHAT-10/11).
- Metrics/impact visualizations for highlights → EXP-FUT-02.
- Balfour full case study → EXP-FUT-01.
- Reviewed-not-folded todos: mobile-menu breakpoint change, og-default.png, chat cache observability, CHAT_RATE_LIMITER binding.
