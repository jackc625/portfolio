# Requirements

**Active milestone:** v1.1 — Editorial Redesign
**Defined:** 2026-04-07

This milestone replaces the v1.0 visual system (shiyunlu.com clone with canvas hero, dark/light theme, project card grid, separate resume page) with a locked editorial design system. All v1.0 functional capabilities (chat widget, content collections, deployment, performance, accessibility) are preserved.

---

## Milestone v1.1 Requirements

### Design System (DSGN)

- [x] **DSGN-01**: Site uses Geist + Geist Mono typography across all pages, loaded via Astro 6 Fonts API (self-hosted, no external CDN)
- [x] **DSGN-02**: Site uses warm off-white `#FAFAF7` base + signal red `#E63946` accent palette as flat hex tokens (no oklch, no theme switching)
- [x] **DSGN-03**: Site uses single light theme — dark mode tokens, theme toggle, and theme transition logic removed entirely
- [x] **DSGN-04**: Site uses restrained motion only — canvas hero, GSAP scroll animations, reveal effects, and view transitions are removed; only functional hover/focus state transitions remain
- [x] **DSGN-05**: Locked design rules captured in `design-system/MASTER.md` as the single source of truth for tokens, typography, layout, components, motion, accent usage, and anti-patterns

### Homepage (HOME)

- [ ] **HOME-01**: Homepage shows display hero with `JACK CUTRARA` wordmark (with trailing accent-red `·`), mono metadata block (`AVAILABLE FOR WORK` status + `EST. 2024 · OAKLAND, CA`), and a lead role statement
- [ ] **HOME-02**: Homepage shows a numbered work list (`§ 01 — WORK`) replacing the v1.0 project card grid — each row contains number, title, tech stack, year, and links to the case study
- [ ] **HOME-03**: Homepage shows an editorial about preview section (`§ 02 — ABOUT`) with intro line and short body, linking to `/about`
- [ ] **HOME-04**: Homepage shows a minimal contact section (`§ 03 — CONTACT`) with email, social links, and résumé PDF download

### About (ABOUT)

- [ ] **ABOUT-01**: About page uses editorial structure (intro line + 3 paragraphs covering "what I build / how I think / where I'm headed"), no skill icons, no progress bars, no narrative graphics
- [ ] **ABOUT-02**: About page copy reads as a real engineer's voice — concise, specific, non-corporate, ≤80 words per paragraph

### Works / Projects (WORK)

- [ ] **WORK-01**: Projects index page (`/projects`) uses the same numbered work list pattern as the homepage section, with no card grid
- [ ] **WORK-02**: Project detail pages (`/projects/[id]`) use an editorial case study layout (mono metadata header, big sans title, long-form column body, optional inline images, "next project" link)
- [ ] **WORK-03**: Real project content from the existing content collection (Zod + MDX) appears in the new layouts — no placeholder titles or stacks shipped

### Contact (CONTACT)

- [ ] **CONTACT-01**: Contact section is minimal: `GET IN TOUCH` label + email + inline social links (`GITHUB · LINKEDIN · X · RÉSUMÉ`), no icons, no contact form, no CTA buttons
- [ ] **CONTACT-02**: Résumé link uses `<a download>` and points to `/jack-cutrara-resume.pdf` (placeholder PDF shipped initially, real PDF replaces it later)
- [x] **CONTACT-03**: Standalone `/resume` page is removed entirely; the hosted PDF is the single source of truth for résumé content

### Chat Widget (CHAT)

- [ ] **CHAT-01**: Chat widget retains all v1.0 (Phase 7) functionality: SSE streaming responses, focus trap, rate limiting, conversation persistence across page navigation, defense-in-depth security, mobile full-screen overlay, markdown rendering with XSS sanitization
- [ ] **CHAT-02**: Chat widget visuals match the new design system — no cards, no shadows, no gradients; monochrome surfaces with accent for active state and links only

### Quality (QUAL)

- [ ] **QUAL-01**: Lighthouse scores remain ≥90 on Performance, Accessibility, Best Practices, and SEO across all pages
- [ ] **QUAL-02**: LCP < 2s, CLS < 0.1 maintained on the homepage and project detail pages
- [ ] **QUAL-03**: Full keyboard accessibility with visible focus rings on all interactive elements
- [ ] **QUAL-04**: `prefers-reduced-motion` respected (trivially satisfied — there is effectively no motion to reduce)
- [ ] **QUAL-05**: WCAG AA color contrast (4.5:1 normal text, 3:1 large text) verified on all text/background combinations
- [ ] **QUAL-06**: Responsive across breakpoints (375, 768, 1024, 1440) with no horizontal scroll and readable type at every width

---

## Future Requirements

(None — this milestone is scoped to the redesign only. Future feature work will be defined in v1.2+.)

---

## Out of Scope

Carried over from v1.0:

- Blog / writing section — not needed unless Jack commits to regular writing
- Testimonials — no content source yet
- CMS — static content is sufficient for a personal portfolio
- Contact form — direct links (email, LinkedIn) are more professional
- 3D/Three.js hero — bloats bundle, kills mobile performance
- Skills progress bars — meaningless self-assessment, looks amateurish
- GitHub contribution graph — inconsistent graphs raise questions
- Real-time chat — chatbot covers interactive Q&A
- Background audio — universally disliked, accessibility violation
- Custom loading screens — fast static site doesn't need them

Newly added in v1.1 (replaced or removed from v1.0):

- **Generative canvas hero** — replaced by editorial display type hero (DSGN-04)
- **Dark/light theme toggle** — removed; single warm light theme only (DSGN-03)
- **GSAP scroll animations + page transitions** — removed; restraint = confidence (DSGN-04)
- **Hover micro-interactions (scale, transforms)** — removed; only color/underline transitions remain (DSGN-04)
- **Project card grid** — replaced by numbered editorial work list (HOME-02, WORK-01)
- **Hybrid project layout (featured cards + editorial list)** — replaced by single editorial list (HOME-02, WORK-01)
- **Standalone resume page** — replaced by hosted PDF download (CONTACT-02, CONTACT-03)
- **shiyunlu.com design language clone** — replaced by locked editorial system (DSGN-01 through DSGN-05)
- **Inter / IBM Plex Mono typography** — replaced by Geist / Geist Mono (DSGN-01)
- **OKLCH color tokens** — replaced by flat hex tokens (DSGN-02)

---

## Traceability

Coverage: 25 / 25 requirements mapped to Phases 8-11 ✓

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSGN-01 | Phase 8 — Foundation | Complete |
| DSGN-02 | Phase 8 — Foundation | Complete |
| DSGN-03 | Phase 8 — Foundation | Complete |
| DSGN-04 | Phase 8 — Foundation | Complete |
| DSGN-05 | Phase 8 — Foundation | Complete |
| CONTACT-03 | Phase 8 — Foundation | Complete |
| HOME-01 | Phase 10 — Page Port | Pending |
| HOME-02 | Phase 10 — Page Port | Pending |
| HOME-03 | Phase 10 — Page Port | Pending |
| HOME-04 | Phase 10 — Page Port | Pending |
| ABOUT-01 | Phase 10 — Page Port | Pending |
| ABOUT-02 | Phase 10 — Page Port | Pending |
| WORK-01 | Phase 10 — Page Port | Pending |
| WORK-02 | Phase 10 — Page Port | Pending |
| WORK-03 | Phase 10 — Page Port | Pending |
| CONTACT-01 | Phase 10 — Page Port | Pending |
| CONTACT-02 | Phase 10 — Page Port | Pending |
| CHAT-01 | Phase 10 — Page Port | Pending |
| CHAT-02 | Phase 10 — Page Port | Pending |
| QUAL-01 | Phase 11 — Polish | Pending |
| QUAL-02 | Phase 11 — Polish | Pending |
| QUAL-03 | Phase 11 — Polish | Pending |
| QUAL-04 | Phase 11 — Polish | Pending |
| QUAL-05 | Phase 11 — Polish | Pending |
| QUAL-06 | Phase 11 — Polish | Pending |

**Note**: Phase 9 (Primitives) intentionally has no requirement mappings — it is a sequencing scaffold that builds the component library Phase 10 consumes. All 25 requirements still map to exactly one phase, satisfying coverage rules.
