# Phase 25: Chat Knowledge Refresh & Milestone Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 25-chat-knowledge-refresh-milestone-verification
**Areas discussed:** Chat positioning sync, Holloway + #7 depth, #7 framing, Balfour in chat, Verify + ship boundary, Chat-answer check, Skills list, Experience-field structure, Token budget

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Holloway + #7 depth | How rich the third-person summaries should be | ✓ |
| Chat positioning sync | How far to sync the stale chat identity | ✓ |
| Balfour in chat | Include the internship or Holloway-only | ✓ |
| Verify + ship boundary | Full verification in-phase vs. hand prod Lighthouse to ship | ✓ |

**User's choice:** All four areas selected.

---

## Chat positioning sync

| Option | Description | Selected |
|--------|-------------|----------|
| Full sync | Third-person-mirror the Phase 24 site copy in about-chat.ts (drop "junior", new-grad w/ production experience, contracting on Holloway + seeking full-time) + refresh education from education.ts + refresh personal.summary | ✓ |
| Copy + education, keep blurb | Same, but leave the static.json personal.summary as-is | |
| Minimal add-only | Only ingest Holloway + #7; leave about-chat.ts "junior" + stale "2026" education | |

**User's choice:** Full sync
**Notes:** Driven by the scout finding that about-chat.ts (line 20 "junior software engineer", line 32 "junior or entry-level role") is now stale vs. the Phase 24 repositioned site. Chat must stop contradicting the site.

---

## Holloway chat depth

| Option | Description | Selected |
|--------|-------------|----------|
| Rich summary + themes | Headline + ~5 strongest specifics condensed, ~150-220 words | ✓ |
| Tight blurb | 3-4 sentences, headline + one or two metrics | |
| Full 9-highlight ledger | All nine highlights in third person (heaviest, redundant) | |

**User's choice:** Rich summary + themes
**Notes:** Claude drafts, Jack reviews the copy.

---

## #7 (Multi-Chain EVM trader) framing

| Option | Description | Selected |
|--------|-------------|----------|
| Engineering-invariants framing | Mirror the case study's discipline (safety pipeline, MEV transport, restart-safe idempotent exits) + carry the explicit no-returns-claims discipline | ✓ |
| Standard project summary | Same shape as the other 6 chatSummaries, no special returns caveat | |

**User's choice:** Engineering-invariants framing
**Notes:** Reputationally sensitive (crypto trading bot); the source case study already states "I deliberately make no claims about returns" — carry that into chat.

---

## Balfour in chat

| Option | Description | Selected |
|--------|-------------|----------|
| Include as a one-liner | Add the lightweight 2023 internship (role/company/dates + 1 line) for a complete, honest work-history answer | ✓ |
| Holloway-only | Keep the chat Holloway-only (matches SC wording) | |

**User's choice:** Include as a one-liner
**Notes:** The chat shouldn't "not know" something visible on the site; tiny token cost.

---

## Verify + ship boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Local gates now, prod Lighthouse at ship | Phase 25 runs build + full test suite (D-26 battery + D-15 anchor) + astro-check 0/0/0 + zero-dep lock + leak guard + chat-answer check; prod Lighthouse + milestone completion at /gsd-ship | ✓ |
| Full verification in-phase | Deploy to prod within Phase 25, run edge Lighthouse + milestone audit as part of the phase | |

**User's choice:** Local gates now, prod Lighthouse at ship
**Notes:** The canonical Lighthouse gate is production-on-Cloudflare-edge (localhost non-representative — v1.2/v1.3 precedent); it + /gsd-complete-milestone need the deploy that /gsd-ship orchestrates.

---

## Chat-answer accuracy check (CHAT-11)

| Option | Description | Selected |
|--------|-------------|----------|
| Automated guard + live UAT ask | Build-time first-person leak guard (automated) + a live /gsd-verify-work-style ask to confirm accurate third-person answers | ✓ |
| Automated guard + corpus-presence test | Leak guard + a test asserting Holloway/#7 present in the corpus; skip the live ask | |

**User's choice:** Automated guard + live UAT ask

---

## Skills list refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Light, honest refresh | Add genuinely-used tech (Deno, TanStack Query, Vitest, Ethers.js); additive only | ✓ |
| Leave skills as-is | Curated list stays; new tech already visible in per-item techStack blocks | |

**User's choice:** Light, honest refresh
**Notes:** Additive only — no audit/prune of the existing curated entries this phase.

---

## Experience-field structure

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with a real structured experience block | Drop the redundant about-derived one-liner; build from the experience collection (Holloway rich + Balfour one-liner), leak-guarded | ✓ |
| Keep the one-liner, add alongside | Preserve the backward-compat string + add new content under a new key | |

**User's choice:** Replace with a real structured experience block
**Notes:** The `about` block already answers "who is Jack"; the synthesized one-liner is now stale. Planner finalizes exact JSON shape + updates the leak guard + TS interface.

---

## Token budget posture

| Option | Description | Selected |
|--------|-------------|----------|
| Accept growth, rely on thresholds | #7 gets full sibling treatment; ~47-48k tokens, under the 60k warn / 80k cap | ✓ |
| Cap #7's extended reference tighter | Trim #7's below-fence reference for leaner corpus | |

**User's choice:** Accept growth, rely on thresholds
**Notes:** Grounded in measured numbers — current corpus ~42k tokens; #7 below-fence is 3,378 words (~4.5k tokens), fenced, within the 5,000-word cap.

---

## Claude's Discretion

- Mechanism for reading `education.ts` from the `.mjs` build script (dep-free).
- Exact JSON shape of the structured experience block + the `checkFirstPersonLeaks` walk + the TS interface update.
- Whether Balfour needs a `chatSummary` frontmatter field or is emitted from `summary`/`highlights`.
- How to lift the #7 exclusion cleanly (slug-skip + defensive `MULTI-DEX` regex) without weakening the guard for genuinely-unwanted sources.
- Final wording of all third-person copy (Claude drafts, Jack reviews).

## Deferred Ideas

- Production-edge Lighthouse gate + `/gsd-complete-milestone` → `/gsd-ship`.
- Auditing/pruning the pre-existing curated chat skills list → out of scope (additive refresh only).
- Per-project/per-page OG images → not this milestone.
- Reviewed-not-folded todos: og-default.png (already shipped Phase 24), mobile-menu breakpoint, chat cache-hit-rate observability, CHAT_RATE_LIMITER binding.
