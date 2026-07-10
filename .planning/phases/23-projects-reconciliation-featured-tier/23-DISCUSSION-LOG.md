# Phase 23: Projects Reconciliation & Featured Tier - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 23-projects-reconciliation-featured-tier
**Areas discussed:** #7 case study, Featured-tier structure, Home list scope, Featured set & order, #7 public repo/demo, Source-file handling, Featured section labels, #7 tagline angle

---

## #7 Case Study — Display Title

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-Chain EVM Trader | Roadmap/résumé framing; reads as serious systems work. Slug `multi-chain-evm`. | ✓ |
| Crypto Snipe Bot | The source doc's own H1; less professional to a hiring manager. | |
| Multi-Dex Crypto Trader | Roadmap alt name; "multi-dex" is jargon. | |

**User's choice:** Multi-Chain EVM Trader
**Notes:** Drives slug `multi-chain-evm` and detail route `/projects/multi-chain-evm`.

## #7 Case Study — Authoring

| Option | Description | Selected |
|--------|-------------|----------|
| I draft, you review | Claude writes a first-person draft from the README, Jack edits before ship. | ✓ |
| You'll write it | Jack authors the fenced block himself. | |

**User's choice:** I draft, you review
**Notes:** Same path as the other 6 case studies + Holloway.

## #7 Case Study — Outcome Framing

| Option | Description | Selected |
|--------|-------------|----------|
| Personal build, dev/paper only | Never live capital; outcome = engineering rigor. | |
| Run live with real capital | Bot has traded real funds; reference live operation honestly (no P&L). | ✓ |
| Portfolio/learning project | Systems-design learning exercise framing. | |

**User's choice:** Run live with real capital
**Notes:** Honest live-operation register, no returns/P&L claims (site Out-of-Scope bans overclaiming).

## Featured-Tier Structure (/projects)

| Option | Description | Selected |
|--------|-------------|----------|
| Labeled sections, richer featured | 'Featured' group (richer) + 'More work' group (compact WorkRows). Mirrors Phase 22 D-04. | ✓ |
| One list, tier divider | All 7 uniform WorkRows with a divider after #3. | |
| Featured card grid on top | 3 featured as a card block above a WorkRow list. | |

**User's choice:** Labeled sections, richer featured
**Notes:** Fixes structure; frontend-design finalizes pixels (SC5).

## Featured-Tier Content Richness

| Option | Description | Selected |
|--------|-------------|----------|
| Add the tagline line | Featured entries show the tagline; rest stay compact. | ✓ |
| Same fields, just elevated | Distinction purely visual, no extra copy. | |
| Tagline + description | Richest, but risks reading like cards. | |

**User's choice:** Add the tagline line
**Notes:** One row treatment reused on Home (see Home rows).

## Home List Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 3 featured + 'all work' link | Keep the teaser + a "See all work →" link to /projects. | ✓ |
| 3 featured, exactly as today | No change; other 4 only via nav. | |
| Featured-then-rest on Home | Home mirrors /projects (all 7). | |

**User's choice:** 3 featured + 'all work' link
**Notes:** Preserves the 30-second teaser; adds discoverability of the rest tier.

## Home Row Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Match /projects (add tagline) | Home featured rows show the tagline too; one treatment everywhere. | ✓ |
| Stay compact on Home | Two row variants; Home lighter. | |

**User's choice:** Match /projects (add tagline)

## Featured Set & Order

| Option | Description | Selected |
|--------|-------------|----------|
| SeatWatch → Multi-Chain EVM → NFL | Roadmap order; SolSniper demoted to rest. | ✓ |
| SeatWatch → NFL → Multi-Chain EVM | Keeps NFL at #2, #7 third. | |
| Multi-Chain EVM → SeatWatch → NFL | Leads with the newest/densest project. | |

**User's choice:** SeatWatch → Multi-Chain EVM → NFL
**Notes:** Featured orders 1/2/3; rest SolSniper(4) → Optimize-AI(5) → Clipify(6) → DayTrade(7). Mechanism (partition by `featured`, sort by `order`) held as Claude/planner discretion.

## #7 Public Repo / Demo

| Option | Description | Selected |
|--------|-------------|----------|
| No public links | Mirrors SolSniper/DayTrade private bots; no github/demo. | ✓ |
| Public GitHub repo | Link a public/sanitized repo. | |

**User's choice:** No public links
**Notes:** `category: "other"`, no `githubUrl`/`demoUrl`.

## Source-File Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Prepend fence, keep README below | Fenced case study at top; README stays as chat-only extended reference. | ✓ |
| Trim to just the case study | Discard the extended reference. | |

**User's choice:** Prepend fence, keep README below
**Notes:** README (~400 lines) becomes the Phase-25 chat extended reference; not rewritten.

## Featured Section Labels

| Option | Description | Selected |
|--------|-------------|----------|
| One WORK section, light tier labels | Single '01 WORK'; light Featured/More-work labels. | ✓ |
| Two numbered sub-sections | '01 Featured' / '02 More work' headers. | |
| Defer entirely to frontend-design | No fixed intent. | |

**User's choice:** One WORK section, light tier labels
**Notes:** Preserves page-level numbering semantic; final label form → frontend-design.

## #7 Tagline Angle

| Option | Description | Selected |
|--------|-------------|----------|
| Capability angle | Matches siblings ("[capability] with [technique]"). | ✓ |
| Systems angle | Architecture/scale framing. | |

**User's choice:** Capability angle
**Notes:** Claude drafts the final ≤80-char wording to match sibling voice.

---

## Claude's Discretion

- All final visual execution (tier layout, label form, divider styling, richer-row form, spacing, type) → frontend-design skill against MASTER.md (SC5).
- Component shape: extend `WorkRow` (optional `tagline`) vs. a new `FeaturedRow` primitive.
- Content drafting: exact tagline wording, the 600–900w case-study prose, `year`, `techStack` for #7.
- Single-distinction ordering mechanism: partition by `featured`, sort within by `order`.
- "See all work →" link idiom (likely the existing `.read-more` pattern).

## Deferred Ideas

- #7 into chat knowledge + third-person `chatSummary` → Phase 25 (CHAT-10/11).
- Per-project OG images / og-default → Phase 24 metadata / standalone todo.
- EXP-FUT-02 metrics visualizations → out of this phase.
- Four keyword-matched todos (mobile-menu breakpoint, og-default image, chat cache observability, CHAT_RATE_LIMITER binding) reviewed, not folded — none touch project reconciliation.
