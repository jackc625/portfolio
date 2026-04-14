---
phase: 11-polish
asvs_level: 1
threats_total: 10
threats_closed: 10
threats_open: 0
audited: 2026-04-14
---

# Phase 11 Security Audit

**Verdict:** SECURED — 10/10 threats closed

Verification of threats declared in 11-01-PLAN.md, 11-02-PLAN.md, and 11-03-PLAN.md `<threat_model>` blocks. Implementation files read-only; no patches applied.

## Threat Verification

### Mitigate Dispositions (3)

| Threat ID | Category | Component | Mitigation Expected | Evidence | Status |
|-----------|----------|-----------|---------------------|----------|--------|
| T-11-01 | I — Info Disclosure | /dev/primitives route | Delete route entirely (D-16) | `ls src/pages/dev` returns "No such file or directory". `src/pages/` contains only 404.astro, about.astro, api/, contact.astro, index.astro, projects/, projects.astro. | CLOSED |
| T-11-02 | I — Info Disclosure | mockup.html at repo root | Delete the file (D-15) | `ls mockup.html` at repo root returns "No such file or directory". | CLOSED |
| T-11-07 | T — Tampering | Git merge to main | Pre-merge safety checks + --no-ff | 11-03-SUMMARY.md §Accomplishments: "Pre-merge safety checks passed: no divergence, 0 conflicts, 168 files changed as expected" and "feat/ui-redesign merged to main with --no-ff merge commit" and "Build verified on main before push (0 errors, 0 warnings, 0 hints)". `git log main --merges` shows `bad4f5b Merge feat/ui-redesign: v1.1 Editorial Redesign`. | CLOSED |

### Accept Dispositions (7)

All seven accepted risks are documented in their respective PLAN.md `<threat_model>` blocks with explicit rationale. Per audit policy, accepted risks with documented rationale are treated as CLOSED.

| Threat ID | Category | Component | Accepted Rationale (from plan) | Status |
|-----------|----------|-----------|-------------------------------|--------|
| T-11-03 | D — DoS | noindex prop on BaseLayout | Prop defaults to false; misuse only affects SEO indexing. Low risk. | CLOSED (accepted) |
| T-11-04 | S — Spoofing | Focus ring visibility | Accent outline on warm off-white; 3:1 contrast meets WCAG 1.4.11 for UI indicators. | CLOSED (accepted) |
| T-11-05 | I — Info Disclosure | Lighthouse JSON reports | Contain only page metrics, no secrets. Stored in .planning/ (not deployed). | CLOSED (accepted) |
| T-11-06 | S — Spoofing | Contrast ratio calculation | Standard WCAG formula on known hex values; no external input. | CLOSED (accepted) |
| T-11-08 | D — DoS | Cloudflare Pages deployment | Cloudflare DDoS protection; static site; rollback via git revert. | CLOSED (accepted) |
| T-11-09 | I — Info Disclosure | .planning/ in public repo | No secrets in planning artifacts; repo already public. | CLOSED (accepted) |
| T-11-10 | E — Elevation of Privilege | Chat API in production | Phase 7 mitigations: rate limit 5/60s, input validation, ANTHROPIC_API_KEY in Cloudflare Workers secrets (not code). | CLOSED (accepted) |

## Unregistered Flags

None. SUMMARY.md files for 11-01, 11-02, and 11-03 contain no `## Threat Flags` section.

## ASVS Level 1 Coverage Notes

- **V1 Architecture:** Trust boundaries declared for build pipeline, Lighthouse CLI, localhost dev server, git merge, Cloudflare Pages, and chat API.
- **V5 Validation:** Chat API input validation verified as accepted via Phase 7 carryover (T-11-10).
- **V8 Data Protection:** No secrets in repo — ANTHROPIC_API_KEY stored in Cloudflare Workers secrets (T-11-10 rationale).
- **V11 Business Logic:** Rate limiting (5/60s) accepted from Phase 7.
- **V14 Configuration:** Public routes hardened — `/dev/*` and `mockup.html` removed (T-11-01, T-11-02).

## Block Decision

- `block_on: high` configured.
- 0 open threats, 0 unregistered flags, 0 high-severity findings.
- **PASS** — no blockers. Phase 11 quality/security gate satisfied.

## Accepted Risks Log

The seven accept-disposition threats above are formally logged as accepted for the v1.1 milestone. Re-evaluation would be triggered by:
- Adding user-generated content or authenticated endpoints (re-evaluate T-11-09, T-11-10).
- Changing Cloudflare deployment posture (re-evaluate T-11-08).
- Introducing the `noindex` prop to production pages (re-evaluate T-11-03).
