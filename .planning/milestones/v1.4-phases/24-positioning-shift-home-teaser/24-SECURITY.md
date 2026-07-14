---
phase: 24
slug: positioning-shift-home-teaser
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-14
---

# Phase 24 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Phase 24 is a copy / content / metadata phase (positioning shift, Home Experience
teaser, enriched Person JSON-LD, real OG card) plus a UAT-gate copy fix (removal of
About P2). It introduces no runtime input, no new dependency, and no new network
surface. The chat pipeline is explicitly out of scope (D-17) and provably untouched.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| author content → build-time module | `education.ts` / `about.ts` strings are author-controlled constants compiled at build; no user input crosses here | Static author copy (trusted) |
| module → JSON-LD `<script>` | education + person schema fragments are serialized into a `ld+json` script via the existing `JsonLd.astro` escaper (no hand-rolled script tag) | schema.org metadata (author-controlled) |
| static asset → social / link preview | `public/og-default.png` is served as a static file; no user input, no runtime processing | Static 1200×630 PNG |
| repo state → capstone gate | `24-BASELINE.json` records the phase-start invariant fingerprint; the capstone trusts it to prove no protected file / dependency drifted across the phase | SHA-256 fingerprints of 8 protected files + deps + OG placeholder |
| build artifacts → chat pipeline | `portfolio-context.json` is regenerated at build from chat inputs this phase does not touch (D-17); the chat "about" block is sourced from `about-chat.ts`, not `about.ts` | Chat corpus (public content) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-24-01 | Tampering (XSS) | `education.ts` strings reaching a `ld+json` script | low | mitigate | Fragments consumed via `JsonLd.astro`'s `<`/`>`/`&`/U+2028/U+2029 escaping (V5.3 output encoding); the phase defines constants only and never hand-rolls a `<script>` tag. Verified: `home-teaser-render.test.ts` JSON.parses the rendered ld+json and asserts structure (GREEN this session). | closed |
| T-24-02 | Tampering (XSS) | `personSchema` → `JsonLd.astro` | low | mitigate | All schema data flows through the existing `JsonLd.astro` serializer; the phase spreads author-controlled constants via `<JsonLd schema={personSchema} />`, no hand-rolled script tag. Verified: render gate GREEN; standalone Person validated at validator.schema.org during execution (24-04 sign-off #3). | closed |
| T-24-03 | Tampering (invariant break) | chat-surface via `BaseLayout.astro` / `global.css` / chat inputs | low | mitigate | D-19/D-17: all teaser + schema + About + education edits are page-scoped (`index.astro` / `about.astro`) or per-page props; Gate E (`chat-surface-untouched`) pins 11 BaseLayout anchors and `verify-phase24-invariants.mjs` proves BaseLayout + global.css + all chat files byte-identical to the phase-start baseline and `portfolio-context.json` regenerates byte-identical. Verified GREEN this session (incl. after the UAT P2-removal fix). | closed |
| T-24-04 | Information disclosure (accuracy) | education facts on `/about` | low | mitigate | Facts sourced from `education.ts` ground-truth (WGU B.S. CS May 2026, VT transfer sub-note, LPI Linux Essentials); VT rendered as a transfer sub-note only, never a credential (D-10). Verified: `about-education-render.test.ts` asserts the exact visible facts (GREEN this session). | closed |
| T-24-05 | Spoofing (misleading preview) | `og-default.png` content | low | accept | Author-controlled static card; content reviewed against MASTER.md + honest-register copy rules at the human checkpoint (execution 24-04 sign-off #4 AND UAT Test 3 — Jack approved); `verify-phase24-og.mjs` proves it is a real 1200×630 PNG distinct from the placeholder (exit 0 this session). | closed |
| T-24-06 | Tampering (invariant break) | protected chat-surface / dependency files across the phase | low | mitigate | Baseline hashes + `verify-phase24-invariants.mjs` detect any BaseLayout / global.css / chat / dependency edit committed anywhere in 24-01..04, closing the working-tree-only blind spot. Verified: exit 0 this session (8 protected files + dependencies match the baseline). | closed |
| T-24-SC | Tampering (supply chain) | npm/pip/cargo installs | low | accept | Zero package installs phase-wide (D-19: no new runtime deps); `verify-phase24-invariants.mjs` asserts `package.json` dependencies byte-identical to the phase-start baseline (exit 0 this session). The UAT P2-removal fix added no dependency. No package-manager attack surface introduced. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**UAT-gate change note:** The verify-work P2 removal (commit `c1c2022`) edits static author copy in `src/data/about.ts` + `src/pages/about.astro` and a test in `tests/client/about-data.test.ts`. It introduces no new input, boundary, dependency, or network surface, and the chat surface stays byte-identical (`portfolio-context.json` unchanged, `build-chat-context.mjs` untouched). The existing register above fully covers it; no new threat is raised.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-24-01 | T-24-SC | This phase installed zero packages (D-19 / QA-02 forbid new runtime deps). Dependencies verified byte-identical to the phase-start baseline via `verify-phase24-invariants.mjs` (exit 0). No package-manager surface introduced. | Jack Cutrara | 2026-07-14 |
| AR-24-02 | T-24-05 | `og-default.png` is author-controlled static content with no runtime processing. Visual fidelity + honest-register content reviewed and approved at the human checkpoint (execution 24-04 sign-off #4 and UAT Test 3). The OG verifier proves it is a real 1200×630 PNG distinct from the placeholder. | Jack Cutrara | 2026-07-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-14 | 7 | 7 | 0 | gsd-secure-phase (ASVS L1 grep-depth, Opus) — register authored at plan time, short-circuit verified against GREEN phase-24 gates + this session's re-run |
| 2026-07-14 | 7 | 7 | 0 | gsd-secure-phase re-run (ASVS L1, Opus) — re-executed `verify-phase24-invariants.mjs` (exit 0, 8 protected files + deps match baseline) and `verify-phase24-og.mjs` (exit 0, real 1200×630 PNG distinct from placeholder) live; confirmed `JsonLd.astro` `<`/`>`/`&`/U+2028/U+2029 escaping + all 7 mitigation artifacts present. `register_authored_at_plan_time: true`, `threats_open: 0` → short-circuit (no deeper auditor pass required at L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-14
