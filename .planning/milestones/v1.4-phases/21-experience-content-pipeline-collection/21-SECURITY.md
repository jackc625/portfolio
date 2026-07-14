---
phase: 21
slug: experience-content-pipeline-collection
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-09
---

# Phase 21 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| author → sync script | The `source:` frontmatter value is author-controlled and is resolved to a filesystem path `scripts/sync-experience.mjs` reads. Build-time only; no network, no auth, no runtime user input. | Filesystem path (build-time) |
| author → build (`astro check`) | Frontmatter authored in the `experience` `.mdx` entries crosses into the typed render contract validated by the Zod schema at build. | Frontmatter fields (build-time) |
| contributor PR → CI drift gate | A PR may change a fenced source or an MDX body; the CI `--check` step detects divergence before merge. | MDX body / fenced source content |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-21-01 | Information Disclosure | `syncOne` `source:` path resolution in `scripts/sync-experience.mjs` | medium | mitigate | Path-traversal guard `!absSource.startsWith(PROJECT_ROOT + sep)` (`scripts/sync-experience.mjs:145`) → `process.exit(2)` (`:211`). Backed by the status-asserted exit-2 integration test (`tests/scripts/sync-experience.test.ts:121`) that asserts both the `escapes project root` message and `status === 2` (`:153`). | closed |
| T-21-02 | Tampering | Frontmatter/fence parsing + `experience` Zod schema + CI drift gate | medium | mitigate | `readSourceField` (`:68`) / `extractFence` (`:104`) reject malformed frontmatter and missing/duplicate/out-of-order fence markers (exit 2), covered by mirrored unit tests. `experience` Zod schema (`src/content.config.ts:25`) validates every entry at `astro check` before it reaches a render surface. CI step `Verify Experience/ <-> MDX sync is clean` (`.github/workflows/sync-check.yml:44`) runs `pnpm sync:experience:check` (exit 1 on drift), blocking merges where an MDX body diverges from its fenced source. | closed |
| T-21-SC | Tampering | npm installs | n/a | accept | Zero package installs this phase (SC4) — no third-party code added; supply-chain surface unchanged. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-21-SC | T-21-SC | Zero package installs this phase; content, script-lift, schema, and CI only. No `[ASSUMED]`/`[SUS]` packages added, so the npm-install tampering surface is unchanged from the prior baseline. | Jack Cutrara | 2026-07-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-09 | 3 | 3 | 0 | gsd-secure-phase (L1 grep-depth, short-circuit: register authored at plan time, ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-09
