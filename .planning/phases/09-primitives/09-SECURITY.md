---
phase: 9
slug: primitives
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-08
---

# Phase 9 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Phase scope:** Design-system primitives refactor — CSS foundation tokens, stateless primitives, composite primitives, BaseLayout swap, kept-component audit, dev-only preview route, verification gate. No new authentication, new network endpoints, new data stores, or new user input surfaces introduced.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Static site → public internet | Pre-rendered HTML/CSS/JS served from Cloudflare Pages | Public portfolio content only (no PII, no secrets) |
| Dev preview route → search crawlers | `/dev/primitives` page compiled into production build | None intended — route is indexing-suppressed via triple defense |

No server-side trust boundaries exist in this phase — the site remains fully static at the adapter level (Cloudflare Pages, `adapter: cloudflare()` in `astro.config.mjs:12`). Per-route SSR is not used by any file touched in this phase.

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|

*No threats declared at plan time.* Eight PLAN.md files were produced for phase 9; none contained a `<threat_model>` block. Seven of eight SUMMARY.md files omitted `## Threat Flags` entirely (pure-refactor scope); `09-07-dev-primitives-preview-SUMMARY.md` explicitly filed **Threat Flags: None** after considering the only new surface in the phase (the `/dev/primitives` preview route) — see Defense-in-Depth Verification below.

*Status legend: open · closed*
*Disposition legend: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Defense-in-Depth Verification

Phase 9 did not declare threats, but `09-07` introduced a single new route (`/dev/primitives`) that could, if indexed, expose unfinished UI work to search engines and link-unfurl bots. The plan committed to a triple-indexing-suppression defense. All three defenses are verified present in code as of this audit:

| Defense | File | Line | Evidence |
|---------|------|------|----------|
| Sitemap filter | `astro.config.mjs` | 16 | `filter: (page) => !page.includes("/dev/")` — `/dev/*` routes excluded from generated sitemap |
| robots.txt disallow | `public/robots.txt` | 3 | `Disallow: /dev/` — honored by compliant crawlers |
| HTML meta robots | `src/pages/dev/primitives.astro` | 48 | `<meta name="robots" content="noindex, nofollow" />` — per-page override appended after BaseLayout SEO tags |

No other phase-9 files open a new trust boundary. CSS tokens (`09-02`), stateless primitives (`09-03`), composite primitives (`09-04`), the BaseLayout swap (`09-05`), and the kept-component audit (`09-06`) are pure internal refactors that do not introduce user input, network I/O, storage, or authentication logic. The master amendment (`09-01`) and verification gate (`09-08`) are planning/docs artifacts with no runtime code impact.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-08 | 0 | 0 | 0 | gsd-secure-phase (workflow Step 3 fast-path: zero declared threats) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer) — vacuously satisfied, register is empty
- [x] Accepted risks documented in Accepted Risks Log — none to document
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter
- [x] Defense-in-depth claim for `/dev/primitives` verified against implementation files

**Approval:** verified 2026-04-08
