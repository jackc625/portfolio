---
status: complete
phase: 22-experience-page-holloway-case-study
source: [22-01-SUMMARY.md, 22-02-SUMMARY.md, 22-03-SUMMARY.md, 22-04-SUMMARY.md, 22-05-SUMMARY.md]
started: 2026-07-10T00:35:12Z
updated: 2026-07-10T00:41:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Experience-first navigation
expected: "experience" appears first in the primary nav (desktop + mobile), active-state accent on /experience, and the four-item nav does not wrap/crowd/clip at 768px and 1024px.
result: pass
source: automated-browser
evidence: "navOrder=[/experience,/projects,/about,/contact] both desktop + mobile menu; aria-current=page on /experience (ink vs muted); single-line no-overflow at 1024px (463px clearance) and 768px (navRight 721<768); mobile menu experience-first."

### 2. Experience listing page (/experience)
expected: Asymmetric two-tier page. Holloway is the featured entry — role·dates eyebrow, "Holloway Company" heading (no leading "The"), uppercase tech line, first-person summary, all 5 highlights as a hairline ledger, and an accent "Read the full case study →" link. Below an "EARLIER" divider, Balfour appears as a lighter, all-mono, NON-LINKED entry with zero accent.
result: pass
source: automated-browser
evidence: "h2='Holloway Company' (no The); uppercase tech line; first-person summary; 5 highlights; accent link→/experience/holloway; 'Earlier' divider; Balfour has 0 links (balfourLinks=[]). Screenshot: uat-22-experience-listing.png"

### 3. Holloway case study deep-dive (/experience/holloway)
expected: The deep-dive link opens the case study. H1 "Holloway Company", mono eyebrow (dates · tech), first-person lead, then the full write-up (Overview + 9 numbered highlights + Themes). No external-links row. Exactly two "← Back to experience" links (one near the top, one at the bottom), both returning to /experience.
result: pass
source: automated-browser
evidence: "H1='Holloway Company'; h2s=[Overview, Highlights, Themes at a glance]; 9 h3 highlight subheads; blockquote lead-in; first-person lead; externalLinksInArticle=[]; backLinkCount=2 (both '← Back to experience'→/experience). Screenshot: uat-22-holloway-casestudy.png"

### 4. Balfour structurally excluded
expected: Balfour is not clickable on the listing, and visiting /experience/balfour-beatty directly returns a 404 (no detail route is built).
result: pass
source: automated-browser
evidence: "Listing balfourLinks=[] (non-linked); GET /experience/balfour-beatty → HTTP 404 'Page Not Found'. Only console error site-wide is this intentional 404."

### 5. Voice + visual polish
expected: Both pages match the site's editorial system (six color tokens, Geist fonts, restrained motion, visible focus rings on links). Copy is first-person and contains zero em dashes (en dashes in date ranges are fine). Nothing reads as confidential/internal.
result: pass
objective_checks: "Auto-verified: 0 em dashes on both pages (2 en dashes listing / 4 deep-dive = date ranges); Geist body font; --accent=#E63946; no external/confidential URLs in article body."
user_confirmation: "User reviewed both page screenshots and confirmed 'yes' — hierarchy, voice, and polish read as intended."

### 6. Nav ordering guard (automated)
expected: tests/build/experience-nav.test.ts asserts href "/experience" precedes href "/projects" in Header.astro and MobileMenu.astro.
result: pass
source: automated
coverage_id: 22-02-D1

### 7. Nav active-state guard (automated)
expected: isActive branch matches /experience via startsWith so /experience/[id] is active too, in both primitives.
result: pass
source: automated
coverage_id: 22-02-D2

### 8. Listing shape + D-08 company guard (automated)
expected: experience-summary.test.ts — Holloway company === "Holloway Company", 5 highlights, role/dateRange/non-empty techStack, experience.astro uses sortExperienceEntries + /experience/ deep link.
result: pass
source: automated
coverage_id: 22-01-D2

### 9. Detail route filter guard (automated)
expected: experience-detail.test.ts — hasCaseStudy ids === ["holloway"] (balfour excluded); [id].astro filters hasCaseStudy and carries exactly two /experience back links.
result: pass
source: automated
coverage_id: 22-01-D3

### 10. Experience em-dash guard (automated)
expected: experience-voice-em-dash.test.ts — zero U+2014 in holloway + balfour mdx bodies and page sources (en dashes allowed).
result: pass
source: automated
coverage_id: 22-01-D4

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
