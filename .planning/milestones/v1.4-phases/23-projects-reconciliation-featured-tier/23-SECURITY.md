---
phase: 23
slug: projects-reconciliation-featured-tier
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-10
---

# Phase 23 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| build script → committed chat artifact | The D-15 slug-skip must not alter `src/data/portfolio-context.json` beyond excluding project #7; the chat corpus is a committed build artifact consumed by the chat Worker | Portfolio project corpus (public content destined for the chat LLM) |
| source `.md` fence → synced MDX body | Author-controlled content is machine-copied into the MDX body by `sync-projects.mjs`; the sync path-escape guard remains intact and unmodified | Case-study markdown (author-trusted, static) |

*Plans 23-02, 23-03, 23-04 introduced no new trust boundaries (test-fixture edits, page-scoped CSS, verification-only respectively).*

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-23-01 | Tampering | build-chat-context.mjs slug-skip | medium | mitigate | Skip scoped to the exact slug `multi-chain-evm` (`scripts/build-chat-context.mjs:449` — `continue` before either hard-fail); byte-identical re-emit verified by `build:chat-context:check` + `chat-context-integrity.test.ts`. Defensive source-path regex retained as defense-in-depth. | closed |
| T-23-01-INT | Information Disclosure | chat corpus | medium | mitigate | #7 stays out of `portfolio-context.json` until Phase 25 (D-15). Verified: corpus holds exactly 6 projects, zero `crypto/dex/snipe` tokens; chat-side pins left unchanged and actively assert the exclusion. | closed |
| T-23-02 | Tampering | chat-side test pins | low | mitigate | Six site-side slug arrays updated; the chat-side pins (chat-context-integrity, chat-knowledge-voice, prompt-injection) left unchanged — `chat-context-integrity.test.ts` pins `.length === 6`, `EXPECTED_SLUGS`, and banned `/crypto trader/i`. Editing a pin would silently ingest #7 (a D-15 violation); leaving them untouched is the mitigation. | closed |
| T-23-03 | Tampering | shared style surface (global.css / BaseLayout.astro) | low | mitigate | All tier/tagline/link styling is page-scoped (`projects.astro` / `index.astro`) or primitive-scoped (`WorkRow.astro`). No Phase 23 commit touched `global.css` or `BaseLayout.astro` (git history clean), so the D-26 chat-surface battery and D-15 SSE anchor stay out of scope. | closed |
| T-23-04 | Repudiation | phase-gate sign-off | low | mitigate | Both human gates (content honesty D-02/D-03, visual SC5) captured as an explicit blocking checkpoint with a recorded "approved" resume signal; the sign-off is auditable in `23-04-SUMMARY.md` and commit `74369ac`. | closed |
| T-23-04-INT | Information Disclosure | chat corpus | medium | mitigate | The capstone gate re-ran `build:chat-context:check` + the chat-side pins after the full write-mode build and confirmed #7 is still excluded (6 projects, D-15 holds); the F3 diff guard shows the corpus was not silently rewritten. | closed |
| T-23-SC | Tampering | npm/pip/cargo installs | low | accept | Zero package installs (QA-02). Latest `package.json`/`pnpm-lock.yaml` change is Phase 21; `git diff --exit-code` confirms dependencies are byte-identical phase-wide. No package-manager attack surface introduced. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-23-01 | T-23-SC | This phase installed zero packages (QA-02 forbids new runtime deps). No package-manager surface was introduced; supply-chain risk accepted as no new dependencies were added. Verified byte-identical via `git diff --exit-code -- package.json pnpm-lock.yaml`. | Jack Cutrara | 2026-07-10 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-10 | 7 | 7 | 0 | gsd-secure-phase (ASVS L1 grep-depth, Opus) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-10
