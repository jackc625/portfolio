---
phase: 10
slug: page-port
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-13
---

# Phase 10 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Build-time content validation | Zod schema validates MDX frontmatter at build time; malformed values caught before deploy | MDX frontmatter fields (year, title, techStack, URLs) |
| contact.ts to HTML output | Contact URLs rendered into anchor href attributes | Hardcoded email, GitHub, LinkedIn URLs |
| Content collection to HTML | Project data from MDX frontmatter rendered into page markup | Static MDX content committed to git |
| about.ts to HTML | Static strings rendered into page | Public about page copy |
| MDX content to HTML | MDX files rendered via Astro's Content component at build time | Markdown/MDX body content |
| External URLs in frontmatter to HTML href | githubUrl and demoUrl rendered as links | Zod z.url() validated URLs |
| Chat UI to chat.ts | DOM element IDs, class names, aria attributes are the contract between markup and JS | DOM queries and event handlers |
| localStorage to DOM | Stored messages replayed into the chat panel via renderMarkdown/DOMPurify | Chat message content (user input + bot responses) |
| User-crafted localStorage to renderMarkdown | Malicious localStorage injection attempt | Potentially tampered JSON payloads |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-10-01 | Tampering | content.config.ts schema | accept | Schema is build-time only; no runtime attack surface. Year regex `/^\d{4}$/` prevents injection. | closed |
| T-10-02 | Spoofing | contact.ts URLs | accept | URLs are hardcoded constants committed to git, not user-supplied. No injection vector. | closed |
| T-10-03 | Information Disclosure | contact.ts email | accept | Public contact info -- email, GitHub, LinkedIn are intentionally displayed on the site. | closed |
| T-10-04 | Tampering | getCollection output | accept | Content is static MDX checked into git. Astro renders at build time. No runtime user input. | closed |
| T-10-05 | Information Disclosure | about.ts strings | accept | Public about page content -- intentionally displayed. | closed |
| T-10-06 | Tampering | MDX content rendering | accept | MDX files are build-time only, committed to git. Astro renders at build time with no user input. | closed |
| T-10-07 | Spoofing | External link URLs | accept | githubUrl/demoUrl are Zod-validated as z.url() in schema. Values committed to git. rel="noopener noreferrer" on all external links. | closed |
| T-10-08 | Denial of Service | typing-dot animation | accept | CSS-only animation, runs only during active typing indicator. No performance concern. | closed |
| T-10-09 | Tampering | chat DOM contract | mitigate | All 11 element IDs, 6 class names, aria attributes, and button types preserved exactly. Pre/post-restyle grep audit verified in Plan 05. | closed |
| T-10-10 | Tampering | localStorage chat-history | mitigate | All replayed bot messages flow through renderMarkdown() -> DOMPurify.sanitize() with strict PURIFY_CONFIG. User messages use textContent (not innerHTML). XSS blocked even with manually edited localStorage. | closed |
| T-10-11 | Denial of Service | localStorage quota | mitigate | 50-message cap (MAX_MESSAGES) limits storage to ~50KB max. try/catch on setItem silently fails on quota exceeded. | closed |
| T-10-12 | Tampering | localStorage JSON.parse | mitigate | try/catch around JSON.parse. Malformed data returns null, chat starts fresh. Storage removed on parse failure. Version check (STORAGE_VERSION) clears incompatible schemas. | closed |
| T-10-13 | Information Disclosure | localStorage chat content | accept | Chat messages are user-facing content visible in the panel. localStorage is same-origin. No PII beyond what the user typed. Privacy note updated to "Conversations stored locally for 24h." | closed |
| T-10-14 | Tampering | Interrupted SSE partial messages | mitigate | Bot message save is hooked ONLY at stream completion. Interrupted streams (AbortController timeout, network error) do NOT save partial content. | closed |
| T-10-15 | Tampering | Full phase verification | mitigate | Automated gate (build + lint + check + test) catches regressions. Content assertions verify expected route count and featured project count. Manual gate verifies chat security features (focus trap, XSS sanitization via DOMPurify, rate limiting) are functional. | closed |
| T-10-gc-01 | Tampering | chat.ts message insertion | accept | insertBefore is equivalent to appendChild for DOM order -- no new XSS vector. History content still goes through textContent (user) and renderMarkdown+DOMPurify (bot). | closed |

*Status: open / closed*
*Disposition: mitigate (implementation required) / accept (documented risk) / transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-10-01 | Build-time schema validation has no runtime attack surface | Phase 10 plan review | 2026-04-13 |
| AR-02 | T-10-02 | Contact URLs are hardcoded constants in version-controlled source | Phase 10 plan review | 2026-04-13 |
| AR-03 | T-10-03 | Email and social links are intentionally public contact info | Phase 10 plan review | 2026-04-13 |
| AR-04 | T-10-04 | Static MDX content is build-time only, no runtime user input | Phase 10 plan review | 2026-04-13 |
| AR-05 | T-10-05 | About page text is intentionally public content | Phase 10 plan review | 2026-04-13 |
| AR-06 | T-10-06 | MDX rendering is build-time only with no user input vector | Phase 10 plan review | 2026-04-13 |
| AR-07 | T-10-07 | External URLs are Zod-validated and use rel="noopener noreferrer" | Phase 10 plan review | 2026-04-13 |
| AR-08 | T-10-08 | CSS-only animation with no performance or security impact | Phase 10 plan review | 2026-04-13 |
| AR-09 | T-10-13 | localStorage is same-origin; chat content is user-visible; privacy note updated | Phase 10 plan review | 2026-04-13 |
| AR-10 | T-10-gc-01 | DOM insertion change uses identical sanitization path as original | Phase 10 plan review | 2026-04-13 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-13 | 16 | 16 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-13
