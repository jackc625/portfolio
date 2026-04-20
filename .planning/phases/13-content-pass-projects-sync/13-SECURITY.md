# SECURITY.md — Phase 13: content-pass-projects-sync

**Audit date:** 2026-04-19
**Auditor:** gsd-security-auditor (ASVS L1; block_on=high)
**Phase:** 13 — Content Pass + Projects/ as Source of Truth + Sync
**Threats Closed:** 9/9 (7 mitigate verified in code; 2 accept documented below)
**Unregistered Flags:** 0

This is a first-time audit (no prior SECURITY.md). Verifies mitigations declared in the 9 plan threat models against the implemented code. Implementation files were not modified during this audit.

---

## Threat Verification Summary

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-13-01 | Tampering | mitigate | CLOSED | `scripts/sync-projects.mjs:164` guard `!absSource.startsWith(PROJECT_ROOT + sep)`; error string `scripts/sync-projects.mjs:168` `"source path escapes project root"`; test `tests/scripts/sync-projects.test.ts:98-119` describe `"S3 path-traversal guard (T-13-01)"` asserts `/escapes project root/` on stderr/message |
| T-13-02 | Information Disclosure | accept | CLOSED | Logged in Accepted Risks §1 below. Manual review during authoring; entropy scan deferred to v1.3+ |
| T-13-DOC-01 | Information Disclosure | accept | CLOSED | Logged in Accepted Risks §2 below. Executor was instructed not to invent resume URL; no URL leak possible |
| T-13-03 | Tampering | mitigate | CLOSED | `.github/workflows/sync-check.yml:4` uses `pull_request:` (not `pull_request_target`). No match for `pull_request_target` in the workflow file. Untrusted PR fork code cannot abuse repo secrets |
| T-13-04 | Tampering / Information Disclosure | mitigate | CLOSED | `src/data/portfolio-context.json` parses as valid JSON (node `JSON.parse` smoke OK); Daytrade entry present (`"name": "Daytrade"`, `"page": "/projects/daytrade"`); zero "crypto-breakout" / "Crypto Breakout" residue. Chat surface unchanged: `src/pages/api/chat.ts:6` import path identical. Phase 7 regression battery verdict: PASS (`13-09-phase-gate-d26-and-build-SUMMARY.md:82-105`, automated chat.test.ts + security.test.ts + validation.test.ts all green) |
| T-13-05 | Repudiation | mitigate | CLOSED | `src/data/about.ts:6,10,14,18` contain four `/* Verified: 2026-04-19 */` annotations using today's real execution date (matches env currentDate), not the planning date. Git blame is the durable evidence per D-18 |
| T-13-06 | Repudiation | mitigate | CLOSED | `.planning/phases/13-content-pass-projects-sync/13-UAT.md:2` `status: complete`; line 18 `[complete — all 14 surfaces passed Jack's batch UAT 2026-04-19]`. All 14 surface rows carry `result: passed` with evidence/fix fields committed — grep shows ≥14 passed-rows in the file. Git blame on the checkoff commit is the durable record |
| T-13-07 | Denial of Service / Performance | mitigate | CLOSED | `13-09-phase-gate-d26-and-build-SUMMARY.md:107-118` Lighthouse CI gate PASS on `/` and `/projects/seatwatch`: Performance 100/100 (target ≥99), TBT 70ms both (target ≤150ms), CLS 0.002/0.000 (target ≤0.01), A11y 95/95, BP 100/100, SEO 100/100. Lighthouse run ad-hoc via `pnpm dlx lighthouse` — no `.lighthouserc.js` or package.json script (acceptable; plan 09 Option A was `pnpm dlx` which leaves package.json byte-identical per S8) |
| T-13-08 | Repudiation | mitigate | CLOSED | `13-09-phase-gate-d26-and-build-SUMMARY.md` exists with full phase close-out (CONT-XX coverage, D-26 transcripts, Lighthouse table, S8 gate confirmation, final test counts, build route verification). Plan 09 Task 4 produced the SUMMARY; STATE.md update + git commit by orchestrator is the durable signoff |

---

## Accepted Risks Log

### §1 — T-13-02: Sensitive content in Projects/*.md case studies

- **Category:** Information Disclosure
- **Component:** All 6 `Projects/*.md` source-of-truth case studies
- **Disposition:** Accept
- **Rationale:** Per RESEARCH §"Security Domain", the control is manual review during authoring. Case studies are Jack's own engineering prose — no API keys, no credentials, no secrets. An automated entropy/secret scan is deferred to a later phase (v1.3+). Risk is bounded by the nature of the content (technical narrative, not configuration).
- **Residual risk:** A distracted author could paste a secret into a case study. Detection is limited to code review before merge.
- **Review trigger:** Re-evaluate during v1.3 if CI adds secret scanning (e.g., gitleaks / trufflehog).

### §2 — T-13-DOC-01: External resume source location disclosure

- **Category:** Information Disclosure
- **Component:** `docs/CONTENT-SCHEMA.md` §3 Resume PDF workflow subsection
- **Disposition:** Accept
- **Rationale:** The external resume source (Google Doc / LaTeX template) lives outside the repo. Plan 03 Task 1 explicitly instructed the executor to NOT invent a fake URL and to leave the location as Jack's call to record or omit. Current doc documents the workflow abstractly ("external — Jack maintains source separately") without revealing a private URL.
- **Residual risk:** None in the current doc. Future edits could leak the URL if Jack adds it; he is the trust anchor.
- **Review trigger:** If Jack adds a URL to this section, re-evaluate whether the URL should be public.

---

## Unregistered Flags from SUMMARY.md `## Threat Flags`

None. Grep across all 9 `13-*-SUMMARY.md` files in the phase dir finds zero `Threat Flags` / `threat_flag` / `unregistered` sections. Executors did not report any new attack surface introduced during implementation.

---

## Cross-Reference: Chat Surface Invariants Preserved (T-13-04 detail)

D-26 full Phase 7 regression battery was the binding gate for any chat-touching edit. Plan 09 Task 1 evidence in `13-09-phase-gate-d26-and-build-SUMMARY.md`:

- **Manual smoke (3 queries):** Daytrade grounded correctly; SeatWatch control unchanged; resume refusal invariant holds (graceful deflection, no inline PDF exposure).
- **Automated battery:** `tests/api/chat.test.ts`, `tests/api/security.test.ts`, `tests/api/validation.test.ts` all exit 0. This covers XSS sanitization, exact-origin CORS, 5/60s rate limit, 30s AbortController timeout, focus trap, localStorage persistence, SSE streaming, DOMPurify markdown rendering, clipboard idempotency.

All Phase 7 security invariants hold after the `portfolio-context.json` rename edit.

---

## Build-System Integrity Notes (informational)

- **S8 zero-new-deps gate:** Plan 09 SUMMARY confirms `package.json` dependencies + devDependencies byte-identical to phase start. Only `scripts.sync:projects` and `scripts.sync:check` added.
- **S3 guard unit-tested:** `tests/scripts/sync-projects.test.ts` explicitly asserts the path-traversal guard via a tmpdir-based integration test driving `syncOne` through `main()`.
- **CI workflow ref-safety:** `.github/workflows/sync-check.yml` pins all actions to `@v4`, pnpm 10, Node 22, `--frozen-lockfile`. Base-branch ref execution via `pull_request` (not `pull_request_target`) means fork PR code cannot modify the workflow for its own CI run.

---

## Conclusion

All 9 threats declared in the Phase 13 plan threat models are verified closed against the implemented code and committed evidence. Two accepts are documented above with rationale and review triggers. Zero unregistered flags from executor summaries. Phase 13 meets the ASVS L1 bar for this audit.

No blockers. No escalations. Phase is security-signed-off.
