---
phase: 08
slug: foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-07
---

# Phase 08 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Phase Summary

Phase 8 is a UI/design-system scaffolding phase. Its scope is:

1. Authoring the `design-system/MASTER.md` design contract (documentation only).
2. Deleting v1.0 visual assumptions: oklch tokens, dark mode (toggle, FOUC script, theme transitions, `localStorage.theme`), motion machinery (CanvasHero, GSAP, scroll-trigger, view transitions, `[data-animate]`), 8 dead components, the standalone `/resume` route.
3. Renaming color/spacing/type CSS custom properties to the mockup hex palette and Geist/Geist Mono fonts.
4. Stripping pages back to bare placeholder stubs.

**No new components, routes, network endpoints, data flows, persistence, authentication, or user input handling are introduced.** No third-party services are added or removed beyond static font assets. The chat widget — the only interactive surface — is preserved unchanged as a regression gate; its existing security posture is unaffected by this phase.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser ↔ static origin | Site is served as static HTML/CSS/JS from Cloudflare Pages | No user-supplied data; no PII; no auth |
| (Pre-existing) Browser ↔ chat widget API | Untouched in Phase 8 — out of scope | (Inherited from prior phases) |

Phase 8 introduces no new trust boundaries.

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|

*No threats identified for Phase 8.*

**Rationale:** Phase 8 only renames CSS variables, deletes dead client-only code paths, swaps font files, and writes a Markdown design spec. STRIDE categories (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) have no applicable component in this scope:

- **No new input handlers** → no injection / tampering surface added.
- **No new output sinks** → no XSS surface added (existing markdown rendering in chat widget is untouched and covered by `tests/client/markdown.test.ts`).
- **No new auth, sessions, or identity** → no spoofing / privilege surface.
- **No new logs or audit trails** → no repudiation surface.
- **No new data persistence or transport** → no information disclosure surface. The deletion of `localStorage.theme` reads/writes is a *reduction* in client storage usage, not an addition.
- **No new network endpoints** → no DoS surface.
- **Font self-hosting** → fonts ship from same origin as site assets; no third-party font CDN added.
- **Dead code deletion** → reduces attack surface; does not expand it.

The 08-01 plan (MASTER.md authoring) explicitly recorded "Threat Flags: None. This is a documentation-only plan with no security surface." Plans 08-02 through 08-08 had no threat flags because their scope (delete code, rename tokens, swap fonts) is purely subtractive or cosmetic.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-07 | 0 | 0 | 0 | /gsd-secure-phase (Claude) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer) — vacuously true; register empty
- [x] Accepted risks documented in Accepted Risks Log — none
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-07
