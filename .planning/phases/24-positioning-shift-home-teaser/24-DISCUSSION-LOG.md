# Phase 24: Positioning Shift & Home Teaser - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 24-positioning-shift-home-teaser
**Areas discussed:** Home teaser placement, About + hero copy, Education surfacing, Metadata/job title/OG, plus a second round: education fields, availability wording, tense framing, teaser component shape.

---

## Todo folding

| Todo | Decision | Selected |
|------|----------|----------|
| Design and ship a real og-default.png | Fold into Phase 24's POS-04 metadata pass | ✓ |
| Chat cache-hit-rate observability | Reviewed, not folded (chat instrumentation) | |
| Configure CHAT_RATE_LIMITER binding | Reviewed, not folded (infra/security) | |
| Change mobile menu breakpoint 380->768 | Reviewed, not folded (orthogonal nav) | |

**User's choice:** Fold in the og-default.png todo.

---

## Home teaser placement (HOME-01)

| Option | Description | Selected |
|--------|-------------|----------|
| New section, FIRST | Dedicated EXPERIENCE section above WORK -> 01 EXP / 02 WORK / 03 ABOUT / 04 CONTACT; matches nav order | ✓ |
| New section, after WORK | EXPERIENCE between WORK and ABOUT | |
| Compact teaser, no new section | Slim one-line cue near hero, no renumber | |

**User's choice:** New section, FIRST.

| Option | Description | Selected |
|--------|-------------|----------|
| Headline + one metric | Role/company/dates + summary + one metric-bearing highlight + link | ✓ |
| Mini-summary, 2 highlights | Summary + top 2 highlights as a hairline ledger | |
| Single-sentence hook | Company + one sentence + link | |

**User's choice:** Headline + one metric.

| Option | Description | Selected |
|--------|-------------|----------|
| 0 -> ~1,400 tests | Test-suite growth; echoes About "tests that fail loudly" | ✓ |
| Cross-tenant leak + RLS | Security work across 47 entities | |
| Recovered 91 lost jobs | Data-recovery incident story | |
| Let me pick during copy review | Defer to drafting | |

**User's choice:** 0 -> ~1,400 tests.

**Notes:** Link target settled at `/experience` (listing) per HOME-01 wording; deep-dive is one more click in.

---

## About + hero copy (POS-01, POS-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted revision | Rework intro + P1, keep P2 verbatim, light P3 update, weave in education | ✓ |
| Full lead-with-experience rewrite | Restructure to open on Holloway credibility | |
| Minimal touch | Swap intro line + one sentence only | |

**User's choice:** Targeted revision.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep hero lead as-is | Already production-focused; EXPERIENCE section supplies proof | ✓ |
| Sharpen for experience | Rework hero lead to hint at contract work | |
| Decide at copy review | Draft alternatives, pick later | |

**User's choice:** Keep hero lead as-is.

| Option | Description | Selected |
|--------|-------------|----------|
| "Software engineer", no qualifier | Drop self-applied "junior"; level via content | ✓ |
| "New-grad software engineer" | Explicit new-grad label | |
| Keep "junior software engineer" | Current wording | |

**User's choice:** "Software engineer", no qualifier.

---

## Education surfacing (POS-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated compact block | Editorial credentials mini-section on /about | ✓ |
| Woven into prose only | A sentence in the narrative | |
| Both block + prose | Structured block + narrative mention | |

**User's choice:** Dedicated compact block (About page; Home stays lean).

| Option | Description | Selected |
|--------|-------------|----------|
| Shared data module | src/data/education.ts single source; Phase 25 points chat at it | ✓ |
| Inline in the About page | Hardcode facts; Phase 25 updates chat separately | |

**User's choice:** Shared data module.

| Option | Description | Selected |
|--------|-------------|----------|
| WGU primary + VT sub-note | B.S. CS - WGU - May 2026 + "transferred from Virginia Tech" + LPI line | ✓ |
| Two separate education lines | Distinct WGU + VT entries | |
| Single combined line | Prose-y one-liner | |

**User's choice:** WGU primary + VT sub-note; no GPA/honors.

---

## Metadata, job title & OG (POS-04)

| Option | Description | Selected |
|--------|-------------|----------|
| jobTitle + alumniOf + credential | Person schema gains jobTitle + education structured data | ✓ |
| jobTitle only | Minimal schema change | |

**User's choice:** jobTitle + alumniOf + hasCredential.

| Option | Description | Selected |
|--------|-------------|----------|
| Sharpen SEO description | Reference shipped production/contract experience | ✓ |
| Keep as-is | Leave the current description | |

**User's choice:** Sharpen to signal experience.

| Option | Description | Selected |
|--------|-------------|----------|
| Text-only editorial OG card | Name + Software Engineer + tagline, six-token palette | |
| Editorial + subtle visual | Text card + restrained graphic | |
| Decide with frontend-design | Defer concept to the design pass | ✓ |

**User's choice:** Decide with frontend-design.

| Option | Description | Selected |
|--------|-------------|----------|
| Site only | Leave about-chat.ts / chat JSON / build-chat-context.mjs for Phase 25 | ✓ |
| Also bump chat grad date now | Touch the chat JSON early | |

**User's choice:** Site only (chat is Phase 25).

---

## Availability & framing (second round)

| Option | Description | Selected |
|--------|-------------|----------|
| Currently contracting + seeking full-time | P3 notes ongoing Holloway contract AND full-time search | ✓ |
| Seeking early-career role only | Drop the contract mention in P3 | |
| Keep current wording | "junior or entry-level role" | |

**User's choice:** Currently contracting + seeking full-time; hero "AVAILABLE FOR WORK" stays.

| Option | Description | Selected |
|--------|-------------|----------|
| Present-tense / current | "Currently the solo contract engineer on Holloway Connect..." | ✓ |
| Past / neutral | "Production experience as a contract engineer..." | |

**User's choice:** Present-tense / current.

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse featured treatment, compact | Mirror /experience featured, page-scoped, likely omit stack | ✓ |
| New minimal block | Bespoke compact teaser | |

**User's choice:** Reuse featured treatment, compact.

---

## Claude's Discretion

- OG card concept (deferred entirely to the frontend-design pass).
- Teaser component shape (extend a primitive vs page-scoped block; show/omit stack line - recommend omit).
- Education block form (label grouping, VT sub-note styling, spacing, type scale).
- Copy drafting (Claude drafts, Jack reviews): revised ABOUT_INTRO/P1/P3, teaser sentence + metric, sharpened SEO description, education-block label strings.

## Deferred Ideas

- Chat-side positioning refresh (about-chat.ts, portfolio-context education, wiring chat to education.ts) -> Phase 25 (CHAT-10/11).
- OG per-project/per-page images -> out of scope; only site-wide og-default.png this phase.
