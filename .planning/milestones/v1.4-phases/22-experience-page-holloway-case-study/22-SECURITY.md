---
phase: 22
slug: experience-page-holloway-case-study
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-09
---

# Phase 22 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| test runner → repo source | Tests only READ source files; they mutate nothing at runtime. No untrusted input crosses. | Source text (read-only) |
| build-time content (MDX frontmatter/body) → rendered HTML | The `experience` collection is Zod-validated first-party content, rendered to static HTML at build; no runtime user input reaches the page. | Trusted, in-repo case-study prose |
| URL path → `getStaticPaths` param | `params.id` is enumerated from the collection's `entry.id` (filename stem) at build time, filtered by `hasCaseStudy` — never from a request. | Build-time enum (no request data) |
| shared layout (Header/MobileMenu) → chat surface | Both nav primitives are BaseLayout children; MobileMenu's `<script>` manages `.chat-widget` inert state (D-26). An edit here can regress the chat focus-trap / a11y contract (QA-01). | Focus/inert DOM state |
| aggregate diff → chat surface / dependency lock | Wave 3 gate (22-05) verifies the merged nav + page + styling diff against the D-26 chat-surface battery and the QA-02 byte-identical dependency lock. | Merged diff, package manifest |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-22-01 | Tampering | New test files assert wrong contract (false GREEN) | low | mitigate | Assertions transcribed from locked D-01..D-11 decisions + SC map; each test RED pre-impl (proven discriminating). Tests pass post-impl (22-01/03/04 summaries). | closed |
| T-22-01b | Tampering / EoP | MDX / collection content rendered into HTML | low | accept | First-party, Zod-validated (`content.config.ts`), drift-gated content; rendered at build by Astro, not runtime. Verified: no `set:html` in `experience.astro` or `[id].astro`. | closed |
| T-22-02 | Tampering | Nav markup rendering user-controlled href | low | accept | hrefs are static string literals authored in-repo (verified: `navLinks` arrays in Header.astro / MobileMenu.astro); no user input, no injection vector. | closed |
| T-22-03 | Info Disclosure | Confidential-contract data in the deep-dive body | medium | mitigate | D-07 omits the external-links row (verified: no `http`/external URLs in `[id].astro`); body is owner-approved prose; human content check at Wave 3 gate found no credentials/PII/internal URLs (22-05). | closed |
| T-22-04 | Tampering / DoS | MobileMenu focus-trap + `.chat-widget` inert `<script>` (D-26 battery) | high | mitigate | Edit confined to `navLinks` array + `isActive` (verified: inert-management `<script>` intact, lines ~251–292); `pnpm test` → 623 passed incl. full D-26 chat-surface battery (22-05). | closed |
| T-22-05 | Tampering | global.css edit regressing chat surface | high | mitigate | New CSS confined to page-scoped `<style>`; `src/styles/global.css` NOT touched in phase 22 (verified: last modified in phase 17, commit dcf597b). | closed |
| T-22-06 | Tampering | Path traversal via `getStaticPaths` `params.id` | low | accept | `id` comes from `entry.id` (collection filename stem), filtered by `hasCaseStudy` (verified in `[id].astro`), never from a request; build-time only. | closed |
| T-22-07 | Tampering | Unreviewed dependency drift (QA-02) | high | mitigate | `git diff --exit-code -- package.json pnpm-lock.yaml` → exit 0 (22-05); verified: manifest/lockfile last modified in phase 21, untouched in phase 22. | closed |
| T-22-SC | Tampering | npm/pip/cargo installs | low | accept | Zero new dependencies; no install task anywhere in the phase; QA-02 byte-identical lock verified (22-05). | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-22-01 | T-22-01b | MDX/collection content is first-party, Zod-validated, drift-gated, and rendered at build with no `set:html`; no runtime user markup path exists. | Jack Cutrara | 2026-07-09 |
| AR-22-02 | T-22-02 | Nav hrefs are static in-repo string literals; there is no user-controlled href surface. | Jack Cutrara | 2026-07-09 |
| AR-22-03 | T-22-06 | `getStaticPaths` params derive from `entry.id` (filename stem) with a `hasCaseStudy` filter, resolved at build time; no request-derived path traversal is possible. | Jack Cutrara | 2026-07-09 |
| AR-22-04 | T-22-SC | No package installs occur in the phase; QA-02 byte-identical lock confirms zero dependency additions. | Jack Cutrara | 2026-07-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-09 | 9 | 9 | 0 | gsd-secure-phase (L1 grep-depth, orchestrator) |

L1 grep-depth verification performed directly (short-circuit: `threats_open: 0`, `register_authored_at_plan_time: true`, `asvs_level == 1`). Concrete mitigation checks confirmed in the live codebase: `global.css` and `package.json`/`pnpm-lock.yaml` untouched in phase 22; no `set:html` and no external URLs in the experience routes; `getStaticPaths` gated by `hasCaseStudy`; nav hrefs static; chat-widget inert `<script>` intact; D-26 battery green (623 passed, 22-05).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-09
