# Phase 13: Content Pass + Projects/ Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 13-content-pass-projects-sync
**Areas discussed:** Preamble (section taxonomy + verification mechanism), Existing MDX trust, Sync transformation strategy, Voice & persona lock-in, Sync script design, Follow-ups (resume PDF, rename risk, word-count enforcement, Zod source field)

---

## Preamble — Section Taxonomy & Verification Mechanism

### Section taxonomy for the 6 case studies

| Option | Description | Selected |
|--------|-------------|----------|
| Spec taxonomy (6 H2s) | Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings. Matches ROADMAP criterion #1 verbatim. | |
| Current taxonomy (5 H2s) | Problem / Solution & Approach / Tech / Challenges / Results. Already in all 6 MDX. | |
| Hybrid 5 H2s (merge Approach + Architecture) | Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings. Acknowledges Approach/Architecture overlap. | ✓ |

**User's choice:** Hybrid 5 H2s
**Notes:** Requires ROADMAP success-criterion #1 amendment as an explicit deliverable (D-02).

### "Verified current" mechanism for About / homepage / resume

| Option | Description | Selected |
|--------|-------------|----------|
| Dated annotation in src/data/about.ts + UAT checklist | `/* Verified: 2026-MM-DD */` comments + 13-UAT.md enumerating each page and the resume PDF. | ✓ |
| Snapshot tests (vitest/playwright) | Lock exact strings in tests. Adds infra. | |
| Manual sign-off only | STATE.md note. Lightest, hardest to re-verify. | |

**User's choice:** Dated annotation + UAT checklist

---

## Existing MDX Trust

### Origin of the existing ~750-word MDX bodies

| Option | Description | Selected |
|--------|-------------|----------|
| I wrote it / it's accurate | MDX reflects real work — audit-and-edit. | |
| AI-generated from thin info | Claude wrote during v1.0 — full rewrite. | |
| Mixed — some real, some invented | Per-file audit required. | ✓ |

**User's choice:** Mixed — some real, some invented

### Final 6 projects for v1.2

| Option | Description | Selected |
|--------|-------------|----------|
| Projects/ correct — rename crypto-breakout-trader → daytrade | Rename MDX to match DAYTRADE. Update nav/links. | ✓ |
| Keep crypto-breakout-trader slug, map via sync | URL stays; frontmatter `source:` handles mismatch. | |
| Different | Project set not finalized. | |

**User's choice:** Rename to daytrade (Recommended)

### Phase 14 chat consumption as constraint on rewriting

| Option | Description | Selected |
|--------|-------------|----------|
| Don't optimize for chat — recruiters first | Human 10-min deep-dive is the audience. | ✓ |
| Write with chat retrieval in mind | Front-load facts, named systems, explicit stack. | |
| Both — one-line TL;DR per section | Middle path. | |

**User's choice:** Recruiters first (Recommended)

---

## Sync Transformation Strategy

### Where does the 800-word case-study body live?

| Option | Description | Selected |
|--------|-------------|----------|
| Append fenced case-study section to Projects/*.md | `<!-- CASE-STUDY-START -->` ... `<!-- CASE-STUDY-END -->`. Full README stays below. | ✓ |
| Split into two files per project | Projects/<n>-<NAME>.case-study.md + full README. | |
| Rewrite Projects/*.md entirely to 800 words | Loses the rich READMEs. | |
| Sync extracts by heading selection | Script picks H2s from README. Brittle. | |

**User's choice:** Fenced case-study section inside Projects/*.md (Recommended)

### How do the case studies get written?

| Option | Description | Selected |
|--------|-------------|----------|
| I write them myself, Claude edits | Highest authenticity, slowest. | |
| Claude drafts from Projects/*.md, you edit | Fastest; risk of drift if not corrected. | ✓ |
| Hybrid per file | Case-by-case during execution. | |

**User's choice:** Claude drafts, Jack edits

---

## Voice & Persona Lock-in

### Voice across the site

| Option | Description | Selected |
|--------|-------------|----------|
| First-person everywhere, chat stays third-person | Site is Jack speaking; chat is third-party assistant. Matches Phase 14 CHAT-06. | ✓ |
| First-person everywhere including chat | Conflicts with Phase 14 plan. | |
| Third-person everywhere | Editorial magazine feel; can read self-aggrandizing. | |

**User's choice:** First-person site, third-person chat (Recommended)

### Case-study tone

| Option | Description | Selected |
|--------|-------------|----------|
| Engineering-journal | Direct, specific, systems-named. Matches current seatwatch.mdx. | ✓ |
| Marketing-forward | Outcome-first, polished, fewer technical details. | |
| Postmortem-flavored | Tradeoffs-heavy; risks sounding negative. | |

**User's choice:** Engineering-journal (Recommended)

### Hard rules for VOICE-GUIDE.md (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| No hype / AI-tells banlist | Ban "revolutionary", "seamless", "leverage", em-dash abuse, emoji. | ✓ |
| Numbers or don't claim it | Every perf claim needs a number. | ✓ |
| Past tense for shipped work | "I built" not "I build". | ✓ |
| Named systems over abstractions | "The dual-strategy booking engine" not "an advanced system". | ✓ |

**User's choice:** All four rules

---

## Sync Script Design

### Mapping Projects/*.md ↔ src/content/projects/*.mdx

| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter `source:` field in MDX | Rename-safe; mapping lives with the consumer. | ✓ |
| Filename convention (rename Projects/) | Simpler script; loses 1-6 ordering prefix. | |
| External mapping table in script | Drifts from content. | |

**User's choice:** Frontmatter `source:` field (Recommended)

### Sync-projects.mjs behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Write MDX bodies, leave diff for human review | Matches ROADMAP criterion #4. | ✓ |
| Dry-run default, --write flag required | Safer; adds friction. | |
| Write + auto-run astro check + block on failure | One-command guarantee; slower. | |

**User's choice:** Write + leave diff (Recommended)

### CI / precommit drift gate

| Option | Description | Selected |
|--------|-------------|----------|
| No gate — trust human review | Next sync overwrites hand-edits. | |
| CI check: fail if sync would produce a diff | Forces lockstep; blocks PRs on drift. | ✓ |
| Precommit hook + CI check | Near-impossible to commit drift; adds commit friction. | |

**User's choice:** CI `--check` gate

### docs/CONTENT-SCHEMA.md contents (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Zod schema reference + examples | Every frontmatter field documented. | ✓ |
| Sync contract (fenced block + source field) | Mechanics of the dual-source pattern. | ✓ |
| Author workflow | Step-by-step edit → sync → diff → commit. | ✓ |
| Failure-mode matrix | Every error with its fix. | ✓ |

**User's choice:** All four sections

---

## Follow-up Gray Areas

### Resume PDF regeneration (CONT-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Source doc outside repo, re-export on change | Google Docs / LaTeX elsewhere. Document source location. | ✓ |
| PDF is the source — locked artifact, audit-only | Safest; implies copy drift risk. | |
| Rebuild from repo source (new deliverable) | Adds tooling; against zero-deps preference. | |

**User's choice:** External source (Recommended)

### DAYTRADE rename URL risk

| Option | Description | Selected |
|--------|-------------|----------|
| Rename clean — no redirects, not publicly linked | Verify during planning. | ✓ |
| Rename + Cloudflare redirect | public/_redirects entry for safety. | |
| Keep crypto-breakout-trader slug | Reverses the rename. | |

**User's choice:** Rename clean (Recommended)

### Word-count (600–900) enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Sync warns, doesn't fail | Human tightens if flagged. | ✓ |
| Sync hard-fails out of range | Forces discipline; can block on 50-word overage. | |
| Not enforced | Trust the writer. | |

**User's choice:** Soft warning (Recommended)

### Zod `source:` field strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Required string + existence check in sync | `z.string()` + on-disk verification. | ✓ |
| Optional, warn on missing | Allows one-off content without a Projects/ file. | |
| Required with regex | Rejects typos early. | |

**User's choice:** Required + existence check (Recommended)

---

## Claude's Discretion

- Fence-marker HTML comment exact format — chosen during planning
- Frontmatter parsing library (`gray-matter` vs hand-rolled) — hand-rolled preferred per zero-deps gate
- CI check invocation form (`pnpm sync:check` vs direct node)
- Redline workflow per file (inline / separate file / branch-per-project) — decide at execute time

## Deferred Ideas

- Full Projects/*.md technical README as Phase 14 extended chat context (logged for Phase 14)
- Repo-native resume source tooling (v1.3+ if external source becomes a pain point)
- Word-count hard enforcement (v1.3+ if drift becomes recurring)
- Precommit hook for sync drift (v1.3+ if pre-CI drift accumulates)
