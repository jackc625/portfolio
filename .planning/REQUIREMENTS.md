# Requirements: Jack Cutrara — Portfolio Website

**Milestone:** v1.4 Professional Experience
**Defined:** 2026-07-08
**Core Value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## v1.4 Requirements

Requirements for the v1.4 Professional Experience milestone. Each maps to a roadmap phase.

### Experience Surface (EXP)

- [x] **EXP-01**: An `experience` content collection with a Zod-validated schema (role, company, dates, stack/skills, summary) sourced from `Experience/*.md` via a sync pipeline mirroring the established `scripts/sync-projects.mjs` pattern
- [x] **EXP-02**: Visitor can reach a dedicated Experience page from the primary navigation
- [x] **EXP-03**: Visitor sees the Holloway contract engagement as a scannable summary (headline highlights) on the Experience page
- [x] **EXP-04**: Visitor can open a full Holloway deep-dive case study (its own detail view) from the summary — Problem→Approach→Outcome depth drawn from `HOLLOWAY_EXPERIENCE.md`
- [x] **EXP-05**: Visitor sees the Balfour Beatty 2023 internship as a lightweight earlier-work-history entry (role, dates, 1–2 lines) without a full case study
- [x] **EXP-06**: Experience entries render in reverse-chronological order with role, company, dates, and tech/skills visible at a glance

### Home Teaser (HOME)

- [x] **HOME-01**: Home page surfaces a concise professional-experience teaser (Holloway highlight) that links through to the Experience page for the 30-second recruiter scan

### Positioning (POS)

- [x] **POS-01**: Core Value framing and site copy present Jack as a new-grad engineer with shipped production experience (first-person voice on the site), no longer "a student building side projects"
- [x] **POS-02**: About page narrative is updated to reflect professional experience and graduation, keeping the honest new-grad (not senior) register
- [x] **POS-03**: Education status reflects the completed WGU B.S. Computer Science (May 2026), the Virginia Tech transfer, and the LPI Linux Essentials certification wherever education is surfaced
- [x] **POS-04**: Site metadata (SEO title/description, JSON-LD Person schema) reflects the updated positioning and job-title

### Projects Reconciliation (PROJ)

- [x] **PROJ-01**: The Multi-Chain EVM / Multi-Dex Crypto Trader project (`Projects/7 - MULTI-DEX CRYPTO TRADER.md`) is synced onto the site as a case study through the existing sync pipeline
- [x] **PROJ-02**: SeatWatch, Multi-Chain EVM, and NFL Prediction render in a featured tier at the top of the project listing(s)
- [x] **PROJ-03**: The remaining projects (SolSniper, Optimize-AI, Clipify, DayTrade) remain accessible below the featured tier — nothing is deleted
- [x] **PROJ-04**: The project data model supports the featured/ordering distinction (schema field or explicit ordering) applied consistently across the Projects page and the Home work list

### Chat Knowledge (CHAT)

- [ ] **CHAT-10**: Build-time `portfolio-context.json` generation ingests the new Experience content and the synced project so the chat's grounded knowledge includes the Holloway engagement and project #7
- [ ] **CHAT-11**: The chat widget can accurately answer questions about the Holloway engagement and updated positioning in third person, preserving the CHAT-06 voice-split contract

### Quality Gates (QA)

- [x] **QA-01**: The D-26 chat-surface regression battery and the D-15 SSE byte-identical anchor hold across any change that touches `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`
- [x] **QA-02**: `pnpm exec astro check` stays 0/0/0, Lighthouse holds at or above prior scores on the production-on-Cloudflare-edge canonical gate, and no new runtime dependencies are added

## Future Requirements

Acknowledged but deferred beyond v1.4.

### Experience Depth (EXP-FUT)

- **EXP-FUT-01**: Full case-study treatment for the Balfour Beatty internship (deferred — non-engineering; lightweight entry sufficient for now)
- **EXP-FUT-02**: Metrics/impact visualizations for experience highlights (e.g. the 0→1,400 test count, 223→1 scoping) — defer until the text case study proves the format

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Senior / lead / "5+ years" framing | Dishonest overclaim — the credibility win is an honest new-grad with real production work, not seniority cosplay |
| Deleting off-résumé projects (SolSniper, Optimize-AI, Clipify, DayTrade) | User chose "feature the 3, keep the rest" — the deep dives still reward engineers who scroll |
| Rewriting the existing 6 project case studies | Reconciliation is featuring + ordering, not content rewrites; existing studies stay as authored unless a specific fix surfaces |
| Testimonials / references for Holloway | No publishable content source; contract confidentiality |
| New design system, dark mode, or theme toggle | `design-system/MASTER.md` is the locked editorial contract; removed in v1.1 for a reason |
| Reintroducing a `/resume` route | PDF download at `jack-cutrara-resume.pdf` is sufficient (route removed in v1.1) |
| Blog / writing section | Not committed to a writing cadence (standing project boundary) |
| New runtime dependencies | Zero-new-runtime-dep preferred path established in v1.2 |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXP-01 | Phase 21 | Complete |
| EXP-02 | Phase 22 | Complete |
| EXP-03 | Phase 22 | Complete |
| EXP-04 | Phase 22 | Complete |
| EXP-05 | Phase 22 | Complete |
| EXP-06 | Phase 21 | Complete |
| HOME-01 | Phase 24 | Complete |
| POS-01 | Phase 24 | Complete |
| POS-02 | Phase 24 | Complete |
| POS-03 | Phase 24 | Complete |
| POS-04 | Phase 24 | Complete |
| PROJ-01 | Phase 23 | Complete |
| PROJ-02 | Phase 23 | Complete |
| PROJ-03 | Phase 23 | Complete |
| PROJ-04 | Phase 23 | Complete |
| CHAT-10 | Phase 25 | Pending |
| CHAT-11 | Phase 25 | Pending |
| QA-01 | Phase 25 | Complete |
| QA-02 | Phase 25 | Complete |

**Coverage:**

- v1.4 requirements: 19 total
- Mapped to phases: 19 ✓
- Unmapped: 0 ✓

Phase distribution: Phase 21 (2 — EXP-01, EXP-06) · Phase 22 (4 — EXP-02..05) · Phase 23 (4 — PROJ-01..04) · Phase 24 (5 — POS-01..04, HOME-01) · Phase 25 (4 — CHAT-10, CHAT-11, QA-01, QA-02). QA-01/QA-02 are milestone-level cross-cutting invariants owned by Phase 25 (where chat-surface risk concentrates + the final verification pass runs), but asserted phase-wide via each UI phase's success criteria.

---
*Requirements defined: 2026-07-08*
*Last updated: 2026-07-08 — traceability populated during v1.4 roadmap creation (Phases 21-25, 19/19 mapped)*
