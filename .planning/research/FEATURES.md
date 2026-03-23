# Feature Research

**Domain:** Personal portfolio website for junior SWE candidate
**Researched:** 2026-03-22
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Visitors Expect These)

Missing any of these means the site feels broken, amateur, or incomplete. Recruiters leave in under 10 seconds.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Clear hero/identity section** | Recruiters must know who Jack is and what he does within 3-5 seconds of landing. Name, role, one-liner value prop. | LOW | Above the fold. No ambiguity. "Jack Cutrara -- Software Engineer" not clever taglines. |
| **Responsive design (mobile-first)** | 60%+ of portfolio views happen on mobile (2025 data). Recruiters review on phones between meetings. | MEDIUM | Must be mobile-first, not desktop-adapted. Test on real devices. |
| **Professional navigation** | Users expect to find Home, About, Projects, Resume, Contact without hunting. Broken navigation = instant bounce. | LOW | Sticky/fixed nav. Clear labels. No hamburger menu on desktop. |
| **Projects page with scan-friendly cards** | This is the core product. Recruiters scan 3-5 projects in under 60 seconds. Each card needs: title, one-line description, tech stack tags, thumbnail/screenshot. | MEDIUM | Cards, not lists. Visual hierarchy matters. Link to detail pages. |
| **Project detail/case study pages** | Engineers doing deep review need: problem statement, approach, architecture decisions, tech stack, challenges, outcomes, links to code/live demo. | HIGH | Structure: Problem > Solution > Tech > Challenges > Results > Links. 800-1500 words with visuals. |
| **About page** | Without context on who Jack is, the portfolio feels cold and disconnected. Background, education, path into engineering, interests. | LOW | Keep professional but human. Show personality without being cute. |
| **Resume page with PDF download** | Recruiters need to save/forward your resume to hiring managers. PDF format preserves layout across systems. | LOW | Viewable on-page AND downloadable PDF. Put download button above the fold. |
| **Contact information** | The entire point is to get contacted. Email, LinkedIn, GitHub -- visible and accessible. | LOW | Direct links, not a contact form (per PROJECT.md). Footer presence on every page plus dedicated section. |
| **Fast page load (<2 seconds)** | 38% bounce rate at 3 seconds. 90% increase in bounce probability from 1 to 5 seconds. Recruiters won't wait. | MEDIUM | Target <1.5s LCP. Optimize images, minimize JS, use SSG/SSR. This is non-negotiable for a performance-focused site. |
| **Working links (zero 404s)** | Broken links are the #1 immediate rejection signal. Hiring managers equate broken links with careless engineering. | LOW | Test all links. No "coming soon" placeholders. If a project isn't ready, don't list it. |
| **GitHub profile links** | Engineers will check your code. Make it easy. Link from every project to its repo. | LOW | Per-project repo links on detail pages. Global GitHub link in nav/footer. |
| **Basic SEO/meta tags** | When someone Googles "Jack Cutrara", this site should rank. Title tags, meta descriptions, Open Graph tags. | LOW | Unique title/description per page. OG tags for link previews when shared on LinkedIn/Slack. |
| **HTTPS and custom domain** | yourname.com signals professionalism. HTTP signals amateur hour. | LOW | Jack has a custom domain available. HTTPS is free via any modern host. |

### Differentiators (Competitive Advantage)

These separate a forgettable portfolio from one that gets bookmarked and shared. They signal "this person is a step above."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dual reading modes (scan vs deep)** | Directly serves both audiences: recruiter 30-second scan AND engineer 10-minute deep review. Most portfolios optimize for one, not both. | MEDIUM | Project cards for scan mode. Case study pages for deep mode. Progressive disclosure -- summary first, detail on demand. This is the core differentiator per PROJECT.md. |
| **Project screenshots/visuals/demos** | 84% of employers want to see working applications, not just code. Screenshots make projects real at a glance. Hiring managers won't clone and run your repo. | MEDIUM | Real screenshots, not mockups. GIFs or short video clips for interactive features. Lazy-loaded for performance. |
| **Structured case studies with outcomes** | Transforms "I built a thing" into "I identified a problem, made technical decisions, and delivered results." Shows engineering thinking, not just coding ability. | HIGH | Follow: Context > Problem > Approach > Architecture > Challenges > Results > Learnings. Include specific metrics where possible ("reduced load time by 40%"). |
| **Live demo links for projects** | Lets reviewers experience the work without setup friction. Dramatically increases engagement time and memorability. | LOW (if projects are already deployed) | Not all projects need live demos. Prioritize 2-3 that demo well. Ensure demos are stable and fast. |
| **Dark/light mode toggle** | Shows attention to UX detail and user preference respect. Expected in 2025 dev portfolios. Respecting OS preference via `prefers-color-scheme` is table stakes for a "modern tech stack" claim. | MEDIUM | Default to OS preference. Persist user choice in localStorage. Smooth transition, no flash of wrong theme. |
| **Subtle, purposeful animations** | Polished entrance animations and micro-interactions signal design sensibility. The portfolio IS a demo of frontend skill. | MEDIUM | Page transitions, scroll-triggered reveals, hover states. Keep tasteful -- no parallax overload. Performance budget: animations must not cause jank or increase LCP. |
| **Accessible design (WCAG 2.2 AA)** | Demonstrates professional standards. Most junior portfolios ignore accessibility entirely. Standing out here is easy and impactful. | MEDIUM | Semantic HTML, keyboard navigation, focus indicators, color contrast (4.5:1+), alt text, skip links. ARIA where needed. This is also good SEO. |
| **Print-friendly resume** | Recruiters print resumes. A `@media print` stylesheet that produces clean output from the resume page is a subtle power move. | LOW | CSS print styles. Hide nav, footer, interactive elements. Clean typography. This costs almost nothing to implement. |
| **Structured data / JSON-LD** | Rich search results when someone Googles Jack's name. Person schema, project schema. Shows technical depth. | LOW | Person schema on home/about. CreativeWork schema on project pages. Low effort, high signal. |
| **Performance scores as a feature** | If the site scores 95+ on Lighthouse across all categories, that IS a portfolio piece. It demonstrates real engineering skill. | MEDIUM | Lighthouse 95+ in Performance, Accessibility, Best Practices, SEO. Display this as a badge or mention it. The site proves the claim. |

### Anti-Features (Deliberately NOT Building)

Features that seem appealing but actively hurt the portfolio's effectiveness.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Blog / writing section** | "Shows thought leadership" | No content source for v1. Empty blogs signal abandonment. Half-written posts are worse than no posts. Maintaining a blog is an ongoing commitment that distracts from the portfolio's core mission: getting interviews. | Defer to v2 after site proves its value. If Jack starts writing, add it then. |
| **Contact form** | "Looks professional" | Forms create backend complexity (spam filtering, email delivery, CAPTCHA). Direct email/LinkedIn links are actually more professional for this audience -- recruiters already have email workflows. Forms often go unchecked. | Direct mailto: link, LinkedIn button, GitHub link. PROJECT.md already specifies this. |
| **Flashy 3D / Three.js hero** | "Looks impressive, shows skill" | Bloats bundle size. Kills mobile performance. Increases LCP. Alienates non-technical recruiters. Unless applying for creative/3D roles, it signals "I prioritize showing off over usability." | Subtle CSS animations, clean typography, and fast load times impress more people who actually hire engineers. |
| **Skills progress bars / percentage ratings** | "Quantifies my abilities" | "85% Python" is meaningless and invites skepticism. No hiring manager takes self-reported skill percentages seriously. They look amateurish. | List technologies cleanly with context (e.g., grouped by proficiency or project). Let the project case studies demonstrate depth. |
| **Testimonials section** | "Social proof" | No content source for v1 (per PROJECT.md). Fake or forced testimonials destroy credibility. Empty testimonial sections look worse than none. | Defer entirely. If Jack gets strong recommendations later, add them. LinkedIn endorsements serve this purpose already. |
| **CMS / admin panel** | "Easy content updates" | Massive overengineering for a static portfolio with 5-6 projects. Adds deployment complexity, potential security surface, and maintenance burden. Content changes happen monthly at most. | Static site with content in code/markdown. Edit, commit, deploy. This IS the appropriate workflow for a developer's portfolio. |
| **Analytics dashboard** | "Track visitor behavior" | Building a custom dashboard is wasted effort. Adds JS weight. Privacy concerns. | Add a lightweight analytics script post-launch (Plausible, Umami, or simple Vercel Analytics). Not part of v1 build. |
| **Real-time chat widget** | "Instant communication" | Unnecessary complexity. Nobody expects to chat with a portfolio owner in real-time. Looks spammy. Kills the professional tone. | Email and LinkedIn are sufficient. Response time expectations are different for job seekers vs. businesses. |
| **Excessive page transitions / loading screens** | "Feels like an app" | Custom loading screens on a static site scream "I'm hiding slow performance." Forced wait states frustrate recruiters. Every second counts. | Instant navigation. If the site is fast (and it should be), there's nothing to mask. |
| **GitHub contribution graph embed** | "Shows I code every day" | Inconsistent graphs raise questions. Green squares don't prove skill. Adds visual noise. Can backfire if there are gaps. | Link to GitHub profile. Let curious engineers visit on their own. Focus the portfolio on curated project work, not activity metrics. |
| **Music player / background audio** | "Personal touch" | Universally disliked. Auto-playing audio is an accessibility violation and an instant close-tab trigger. | Don't. |

## Feature Dependencies

```
[Responsive Design]
    └──required-by──> [Every other feature]

[Navigation System]
    └──required-by──> [All pages]

[Design System / Theme]
    └──required-by──> [Dark/Light Mode Toggle]
    └──required-by──> [All page layouts]
    └──required-by──> [Print Styles]

[Projects Page (card grid)]
    └──required-by──> [Project Detail/Case Study Pages]

[Project Detail Page Template]
    └──required-by──> [Structured Case Studies]
    └──required-by──> [Live Demo Links]
    └──required-by──> [Project Screenshots/Visuals]

[SEO Meta Structure]
    └──required-by──> [Structured Data / JSON-LD]
    └──required-by──> [Open Graph Tags]

[Performance Optimization]
    └──enhanced-by──> [Image Optimization / Lazy Loading]
    └──enhanced-by──> [Animations (must not degrade perf)]

[Accessibility Foundation]
    └──enhanced-by──> [Dark/Light Mode (contrast compliance in both)]
    └──enhanced-by──> [Print Styles (alternative access)]
```

### Dependency Notes

- **Design System / Theme required by Dark/Light Mode:** Must establish color tokens, spacing, typography as CSS custom properties BEFORE implementing theme switching. Building dark mode after-the-fact with hardcoded colors is a rewrite.
- **Projects Page required by Case Studies:** The card grid is the entry point. Case study pages are drill-downs. Build the index before the details.
- **Responsive Design required by everything:** Mobile-first CSS must be the foundation, not an afterthought. Every component built must work on mobile from day one.
- **Performance Optimization enhanced by Image Handling:** Screenshots and visuals are the heaviest assets. Lazy loading, responsive images (`srcset`), and modern formats (WebP/AVIF) must be part of the image strategy from the start.
- **Accessibility Foundation enhanced by Theme Toggle:** Both light and dark themes must independently pass WCAG AA contrast ratios. This constraint must be designed in, not patched later.

## MVP Definition

### Launch With (v1)

Minimum viable portfolio -- enough to send to recruiters and not be embarrassed.

- [ ] **Hero section with identity** -- Name, role, one-liner, primary CTA (view projects)
- [ ] **Navigation** -- Fixed/sticky, links to all pages, mobile responsive
- [ ] **Home page** -- Hero + featured projects preview + brief intro
- [ ] **About page** -- Background, education, path into engineering, interests
- [ ] **Projects page** -- Card grid with 5-6 projects (title, description, tech tags, thumbnail)
- [ ] **Project detail pages** -- Case study template with placeholder content for all projects, at least 2 fully written
- [ ] **Resume page** -- Viewable content + PDF download button
- [ ] **Contact section** -- Email, LinkedIn, GitHub links (dedicated page or prominent section)
- [ ] **Responsive design** -- Mobile-first, tested across breakpoints
- [ ] **Performance** -- Sub-2-second LCP, Lighthouse 90+ across categories
- [ ] **Basic SEO** -- Title tags, meta descriptions, OG tags per page
- [ ] **HTTPS + custom domain** -- Professional URL, secure connection
- [ ] **Accessibility baseline** -- Semantic HTML, keyboard nav, color contrast, alt text
- [ ] **Design system** -- Color tokens, typography scale, spacing as CSS custom properties (enables future dark mode)

### Add After Launch (v1.x)

Features to add once core is live and initial feedback is gathered.

- [ ] **Dark/light mode toggle** -- After design system tokens are solid, add theme switching with OS preference detection
- [ ] **Subtle page animations** -- Scroll-triggered reveals, page transitions. Add once performance baseline is confirmed stable.
- [ ] **Structured data / JSON-LD** -- Person and CreativeWork schemas. Low effort but lower priority than core content.
- [ ] **Print-friendly resume** -- @media print stylesheet. Quick win post-launch.
- [ ] **Remaining case studies fully written** -- Fill in placeholder content for all 5-6 projects
- [ ] **Project screenshots and visual polish** -- Real screenshots, GIFs of interactive features, optimized images

### Future Consideration (v2+)

Features to defer until the portfolio has proven its value and Jack has more content.

- [ ] **Blog section** -- Only if Jack commits to writing regularly
- [ ] **Testimonials** -- Only when real, credible testimonials are available
- [ ] **Analytics** -- Lightweight tracking (Plausible/Umami) post-launch
- [ ] **Interactive project demos** -- Embedded live demos for select projects (iframe or similar)
- [ ] **i18n** -- Only if targeting non-English markets

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hero/identity section | HIGH | LOW | P1 |
| Navigation system | HIGH | LOW | P1 |
| Projects card grid | HIGH | MEDIUM | P1 |
| Project detail/case study template | HIGH | HIGH | P1 |
| Responsive design | HIGH | MEDIUM | P1 |
| Resume page + PDF download | HIGH | LOW | P1 |
| Contact links | HIGH | LOW | P1 |
| About page | MEDIUM | LOW | P1 |
| Fast performance (<2s LCP) | HIGH | MEDIUM | P1 |
| Basic SEO/meta tags | MEDIUM | LOW | P1 |
| HTTPS + custom domain | MEDIUM | LOW | P1 |
| Accessibility baseline | MEDIUM | MEDIUM | P1 |
| Design system (CSS custom properties) | HIGH | MEDIUM | P1 |
| Dark/light mode toggle | MEDIUM | MEDIUM | P2 |
| Subtle animations | MEDIUM | MEDIUM | P2 |
| Project screenshots/visuals | HIGH | MEDIUM | P2 |
| Structured data / JSON-LD | LOW | LOW | P2 |
| Print-friendly resume | LOW | LOW | P2 |
| Full case study content (all projects) | HIGH | HIGH | P2 |
| Live demo links | MEDIUM | LOW | P2 |
| Blog section | LOW | MEDIUM | P3 |
| Analytics integration | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- the site is incomplete without these
- P2: Should have, add post-launch -- these elevate from "functional" to "impressive"
- P3: Nice to have, future consideration -- only if circumstances warrant

## Competitor Feature Analysis

Analysis of widely-cited exemplary developer portfolio patterns.

| Feature | Brittany Chiang (gold standard) | Typical Junior Portfolio | Jack's Approach |
|---------|--------------------------------|--------------------------|-----------------|
| Identity clarity | Immediately clear: name, title, one-liner | Often buried or unclear | Bold hero with name + role + one-liner above fold |
| Navigation | Sticky sidebar, scannable sections | Basic navbar, sometimes broken on mobile | Fixed top nav, clear labels, mobile hamburger menu |
| Project presentation | Cards with context, links to detail | GitHub links only or screenshot dumps | Cards with description + tech tags, linking to full case studies |
| Case study depth | Detailed role descriptions, tech decisions | "I built this with React" and nothing more | Structured: Problem > Solution > Tech > Challenges > Results |
| Visual design | Consistent color scheme, clean typography, dark theme | Template-default or inconsistent | Custom design system, professional typography, deliberate color palette |
| Performance | Fast, minimal JS | Often bloated with unused framework code | Sub-2s LCP, Lighthouse 90+, SSG for static content |
| Responsiveness | Excellent mobile experience | Broken or neglected mobile | Mobile-first development |
| Theme toggle | Not present (committed to dark) | Rare at junior level | v1.x addition -- OS preference default + manual toggle |
| Resume access | Not prominent | Often missing or broken link | Dedicated page with inline view + PDF download |
| Contact approach | Email link in nav | Contact form (often broken) | Direct links: email, LinkedIn, GitHub on every page |

## Sources

- [Colorlib - 21 Best Developer Portfolios 2026](https://colorlib.com/wp/developer-portfolios/)
- [Zencoder - How to Create a Software Engineer Portfolio 2026](https://zencoder.ai/blog/how-to-create-software-engineer-portfolio)
- [Codecademy - Junior Developer Portfolio Must-Haves](https://www.codecademy.com/resources/blog/what-to-include-in-a-junior-developer-portfolio)
- [WebPortfolios.dev - Junior Developer Portfolio Guide 2025](https://www.webportfolios.dev/blog/junior-developer-portfolio-guide-2025)
- [Hakia - Building a Portfolio That Gets Hired 2025](https://www.hakia.com/skills/building-portfolio/)
- [Open Doors Careers - 6 Mistakes in 150+ Portfolio Reviews](https://blog.opendoorscareers.com/p/the-6-mistakes-i-saw-most-in-150-portfolio-reviews-and-how-to-fix-them)
- [Codementor - 12 Things Web Developers Must Include](https://www.codementor.io/learn-programming/12-important-things-to-include-in-web-dev-portfolios)
- [8seneca - Software Engineer Portfolio Guide](https://www.8seneca.com/en/blog/technology/software-engineer-portfolio-guide-what-to-include-and-what-to-avoid)
- [Brittany Chiang Portfolio](https://brittanychiang.com/)
- [Shipixen - SEO Checklist for Developer Portfolios](https://shipixen.com/blog/seo-checklist-for-developer-portfolios-and-landing-pages)
- [Pingdom - Page Load Time and Bounce Rate](https://www.pingdom.com/blog/page-load-time-really-affect-bounce-rate/)
- [Tooltester - Website Load Time Statistics 2026](https://www.tooltester.com/en/blog/website-loading-time-statistics/)

---
*Feature research for: Junior SWE personal portfolio website*
*Researched: 2026-03-22*
