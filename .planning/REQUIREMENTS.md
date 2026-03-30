# Requirements: Jack Cutrara Portfolio

**Defined:** 2026-03-22
**Core Value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Identity & Navigation

- [ ] **IDNV-01**: Site displays Jack's name, role, and one-liner value proposition above the fold within 3 seconds of page load
- [ ] **IDNV-02**: Sticky/fixed navigation with clear labels (Home, About, Projects, Resume, Contact) on all pages
- [ ] **IDNV-03**: Mobile hamburger menu that is accessible and smooth on all breakpoints
- [ ] **IDNV-04**: Site served over HTTPS on a custom domain

### Home Page

- [ ] **HOME-01**: Hero section with name, role positioning, brief intro, and primary CTA (view projects)
- [ ] **HOME-02**: Featured projects preview section highlighting 2-3 top projects with links to detail pages
- [ ] **HOME-03**: Brief intro/about teaser that drives visitors to the About page
- [ ] **HOME-04**: Prominent links to resume and contact information

### About Page

- [ ] **ABUT-01**: Background narrative covering education, path into engineering, and interests
- [ ] **ABUT-02**: Professional but human tone — shows personality without being unprofessional
- [ ] **ABUT-03**: Technology/skills presentation grouped by context (not progress bars)

### Projects System

- [x] **PROJ-01**: Projects page with scan-friendly card grid (title, one-line description, tech tags, thumbnail per card)
- [x] **PROJ-02**: Cards link to individual project detail/case study pages
- [ ] **PROJ-03**: 5-6 project slots with placeholder content structure
- [x] **PROJ-04**: Each project card shows tech stack tags for quick scanning

### Case Studies

- [x] **CASE-01**: Structured case study template: Problem > Solution > Tech Stack > Challenges > Results > Lessons Learned
- [x] **CASE-02**: Each case study includes links to GitHub repo and/or live demo where available
- [ ] **CASE-03**: Case study pages support embedded screenshots and visual media
- [x] **CASE-04**: Progressive disclosure — overview/summary visible first, technical depth on scroll
- [ ] **CASE-05**: At least 2 fully written case studies before production deployment

### Resume

- [ ] **RESM-01**: Resume page with viewable content rendered on-page
- [ ] **RESM-02**: PDF download button above the fold
- [ ] **RESM-03**: Print-friendly @media print stylesheet that produces clean output

### Contact

- [ ] **CNTC-01**: Contact section with direct email, LinkedIn, and GitHub links
- [ ] **CNTC-02**: Contact links accessible from every page (footer and/or dedicated page)

### Design System

- [x] **DSGN-01**: CSS custom properties for color tokens, typography scale, and spacing
- [ ] **DSGN-02**: Dark/light mode with OS preference detection (prefers-color-scheme) and manual toggle
- [ ] **DSGN-03**: Theme preference persisted in localStorage with no flash of wrong theme
- [ ] **DSGN-04**: Both themes independently pass WCAG AA contrast ratios (4.5:1+)

### Responsive & Performance

- [ ] **PERF-01**: Mobile-first responsive design tested across breakpoints (mobile, tablet, desktop)
- [ ] **PERF-02**: Sub-2-second Largest Contentful Paint (LCP) on all pages
- [ ] **PERF-03**: Lighthouse 90+ across Performance, Accessibility, Best Practices, SEO categories
- [ ] **PERF-04**: Optimized images with lazy loading, responsive srcset, and modern formats (WebP/AVIF)
- [ ] **PERF-05**: Zero layout shift (CLS < 0.1) during page load

### Animations

- [ ] **ANIM-01**: Subtle scroll-triggered reveal animations on page sections
- [ ] **ANIM-02**: Smooth page transitions between routes
- [ ] **ANIM-03**: Hover states and micro-interactions on interactive elements
- [ ] **ANIM-04**: Animations respect prefers-reduced-motion and do not degrade performance

### SEO & Accessibility

- [ ] **SEOA-01**: Unique title tag and meta description per page
- [ ] **SEOA-02**: Open Graph tags for link previews on LinkedIn, Slack, and social platforms
- [ ] **SEOA-03**: JSON-LD structured data (Person schema on home/about, CreativeWork on project pages)
- [ ] **SEOA-04**: Semantic HTML throughout (proper heading hierarchy, landmarks, labels)
- [ ] **SEOA-05**: Full keyboard navigation with visible focus indicators
- [ ] **SEOA-06**: Skip-to-content link for screen reader users
- [ ] **SEOA-07**: Alt text on all images

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **CNTX-01**: Blog/writing section (only if Jack commits to regular writing)
- **CNTX-02**: Testimonials section (only when credible testimonials available)
- **CNTX-03**: "Currently building" section showing active work

### Analytics

- **ANLT-01**: Lightweight analytics integration (Plausible or Umami)
- **ANLT-02**: Track visitor flow to optimize conversion to contact

### Enhanced Projects

- **ENHP-01**: Project filtering/tags for browsing by technology
- **ENHP-02**: Interactive embedded demos for select projects

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Contact form | Direct links (email, LinkedIn) are more professional for this audience; forms add backend complexity and spam concerns |
| 3D/Three.js hero | Bloats bundle, kills mobile performance, alienates non-technical recruiters |
| Skills progress bars | Meaningless self-assessment; looks amateurish to hiring managers |
| CMS / admin panel | Massive overengineering for a static 5-6 project portfolio |
| GitHub contribution graph | Inconsistent graphs raise questions; green squares don't prove skill |
| Real-time chat | Unnecessary complexity; nobody expects real-time chat on a portfolio |
| Background audio/music | Universally disliked; accessibility violation |
| Custom loading screens | On a fast static site, loading screens mask nothing and frustrate recruiters |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IDNV-01 | Phase 2 | Pending |
| IDNV-02 | Phase 2 | Pending |
| IDNV-03 | Phase 2 | Pending |
| IDNV-04 | Phase 1 | Pending |
| HOME-01 | Phase 3 | Pending |
| HOME-02 | Phase 3 | Pending |
| HOME-03 | Phase 3 | Pending |
| HOME-04 | Phase 3 | Pending |
| ABUT-01 | Phase 3 | Pending |
| ABUT-02 | Phase 3 | Pending |
| ABUT-03 | Phase 3 | Pending |
| PROJ-01 | Phase 4 | Complete |
| PROJ-02 | Phase 4 | Complete |
| PROJ-03 | Phase 4 | Pending |
| PROJ-04 | Phase 4 | Complete |
| CASE-01 | Phase 4 | Complete |
| CASE-02 | Phase 4 | Complete |
| CASE-03 | Phase 4 | Pending |
| CASE-04 | Phase 4 | Complete |
| CASE-05 | Phase 4 | Pending |
| RESM-01 | Phase 3 | Pending |
| RESM-02 | Phase 3 | Pending |
| RESM-03 | Phase 5 | Pending |
| CNTC-01 | Phase 3 | Pending |
| CNTC-02 | Phase 2 | Pending |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 5 | Pending |
| DSGN-03 | Phase 5 | Pending |
| DSGN-04 | Phase 5 | Pending |
| PERF-01 | Phase 6 | Pending |
| PERF-02 | Phase 6 | Pending |
| PERF-03 | Phase 6 | Pending |
| PERF-04 | Phase 6 | Pending |
| PERF-05 | Phase 6 | Pending |
| ANIM-01 | Phase 5 | Pending |
| ANIM-02 | Phase 5 | Pending |
| ANIM-03 | Phase 5 | Pending |
| ANIM-04 | Phase 5 | Pending |
| SEOA-01 | Phase 2 | Pending |
| SEOA-02 | Phase 2 | Pending |
| SEOA-03 | Phase 5 | Pending |
| SEOA-04 | Phase 2 | Pending |
| SEOA-05 | Phase 2 | Pending |
| SEOA-06 | Phase 2 | Pending |
| SEOA-07 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
