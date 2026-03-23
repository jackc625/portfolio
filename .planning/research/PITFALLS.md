# Pitfalls Research

**Domain:** Junior SWE portfolio website targeting interviews
**Researched:** 2026-03-22
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Over-Engineered Showcase, Under-Engineered Content

**What goes wrong:**
The portfolio becomes a tech demo rather than a career tool. Developers spend weeks on particle effects, three.js hero sections, and complex page transitions while project case studies have two sentences each. A hiring manager survey found that "the main factor in rejecting candidates was actually their portfolio site itself (browser errors, over-engineering, inappropriate use of technology)." The site impresses other developers in a Slack channel but fails its actual job: getting Jack interviews.

**Why it happens:**
Building the site IS a project, so developers treat it as a chance to show off technical range. They optimize for peer approval ("cool site!") rather than recruiter utility ("I understand what this person can do"). The PROJECT.md explicitly says "modern tech + best performance" which creates a real pull toward over-engineering.

**How to avoid:**
- Define a strict animation budget: max 2-3 subtle transitions (page transitions, hover states, scroll reveals). No particle effects, no WebGL, no physics-based animations.
- Every interactive element must answer: "Does this help a recruiter understand Jack's capabilities faster?" If no, cut it.
- Treat the site like a product: the user (recruiter/engineer) has a task (evaluate candidate), and the site should reduce friction for that task.
- Time-box visual polish to a fixed percentage of total effort. Content and structure get the majority.

**Warning signs:**
- More time spent on animations than on project case study structure
- Lighthouse performance score drops below 90 due to JS bundle size
- Time-to-interactive exceeds 2 seconds
- The site "needs" a loading screen

**Phase to address:**
Foundation/scaffolding phase. Set the animation policy and performance budget before any UI work begins. Revisit during polish phase with the constraint already locked in.

---

### Pitfall 2: Invisible to Search Engines and Social Crawlers (SPA SEO Trap)

**What goes wrong:**
A client-side rendered SPA sends near-empty HTML to crawlers. Google sees a blank page with a `<div id="root"></div>`. LinkedIn and Twitter link previews show nothing useful when Jack shares his site. Open Graph tags injected via JavaScript are invisible to social media crawlers, which do not execute JS. The site effectively does not exist for discovery purposes.

**Why it happens:**
Modern frontend frameworks default to client-side rendering. Developers build locally, see everything works in their browser, and assume crawlers see the same thing. They don't. Neither Bing, DuckDuckGo, Baidu, Facebook, nor Twitter bots execute JavaScript. Even Googlebot renders JS but with significant delay and resource constraints, adding pages to a render queue rather than indexing immediately.

**How to avoid:**
- Use SSR (server-side rendering) or SSG (static site generation) from the start. A portfolio is ideal for SSG since content changes infrequently.
- Verify with `curl` that the raw HTML response contains actual content, not just a JS bootstrap.
- Implement Open Graph tags in the HTML head at build time, not via client-side JS injection.
- Test social previews with tools like opengraph.xyz before deploying.
- Add structured data (JSON-LD) for Person schema.

**Warning signs:**
- "View Page Source" in browser shows minimal content
- Social media link previews show generic text or blank image
- Google Search Console shows "Discovered - currently not indexed" for pages
- `curl https://yoursite.com` returns `<div id="root"></div>` with no content

**Phase to address:**
Tech stack selection phase. This must be a framework-level decision (SSG/SSR), not a bolt-on fix. Choosing pure CSR and trying to fix SEO later requires a rewrite.

---

### Pitfall 3: Placeholder Content Ships to Production

**What goes wrong:**
The site launches with Lorem Ipsum text, "Project Title Here" headings, or gray placeholder images. Recruiters who find the site (via LinkedIn, resume link, or search) see what looks like an unfinished student project. Research shows portfolios with placeholder content "signal incompleteness" and give "the impression that your work is incomplete." For a junior developer trying to demonstrate professionalism, this is devastating.

**Why it happens:**
The PROJECT.md explicitly plans for placeholder content initially, which is fine for development. The pitfall is when "initially" stretches indefinitely because the structural work felt like the hard part, and filling in real content feels tedious. There is no forcing function that prevents deployment with placeholders.

**How to avoid:**
- Design the placeholder system to be visually distinct and obviously-placeholder (not subtle Lorem Ipsum that could be mistaken for real content). Use banners like "[PLACEHOLDER: Add project description]".
- Implement a build-time check or CI gate that warns if placeholder markers are detected in production builds.
- Write real content for at least 2 projects BEFORE the first deploy. The other 3-4 can show "Coming Soon" which is honest, not fake.
- Create a content template for project case studies so filling them in is fast (problem, approach, tech, outcome, lessons).

**Warning signs:**
- Site is "ready to deploy" but project pages have generic text
- Content writing keeps getting deferred for "one more feature"
- No content checklist exists separate from the dev checklist

**Phase to address:**
Content integration phase (should be explicitly separated from build phase). Create a hard gate: no production deployment until minimum viable content exists.

---

### Pitfall 4: Failing the 10-Second Recruiter Test

**What goes wrong:**
The homepage does not answer "Who is this person and what do they do?" within seconds. Research shows users form opinions in under one second, 53% of mobile visitors leave if a page takes over 3 seconds to load, and the probability of bounce increases 90% when load time goes from 1 to 5 seconds. Recruiters reviewing 50+ candidates have even less patience. If the hero section is vague ("Welcome to my portfolio"), has no clear role title, or requires scrolling to understand what Jack does, the recruiter is gone.

**Why it happens:**
Developers focus on aesthetics over information hierarchy. They write generic taglines ("Passionate about code") instead of specific ones ("Full-stack engineer building X with Y"). The homepage becomes a design exercise rather than a communication tool.

**How to avoid:**
- Above-the-fold content must include: full name, specific role ("Software Engineer"), 1-sentence value proposition, and a clear CTA to projects.
- Test the homepage with the "squint test" -- if you blur the page, the hierarchy of name > role > CTA should still be visible.
- Use the dual-track content model from PROJECT.md: recruiter scan (name, role, top 3 projects) vs. engineer deep dive (case studies, architecture diagrams).
- Ensure LCP (Largest Contentful Paint) is under 2.5 seconds. Preload hero fonts and images.

**Warning signs:**
- Homepage hero section has no role/title identifier
- Need to scroll to find out what the person does
- LCP above 2.5s on mobile throttled connection
- Tagline uses generic phrases ("passionate developer", "lifelong learner")

**Phase to address:**
Layout/structure phase and content phase. Information architecture is a structural decision. The homepage wireframe should be validated against the 10-second test before any visual design begins.

---

### Pitfall 5: Project Showcases Without Narrative

**What goes wrong:**
Projects are displayed as a flat list: title, screenshot, tech stack badges, and a GitHub link. No explanation of what problem was solved, what decisions were made, or what was learned. This is identical to 90% of junior portfolios and completely fails to differentiate. Hiring managers reviewing portfolios ask "How does this person think?" and a screenshot with a tech list provides zero signal.

**Why it happens:**
Developers think the code speaks for itself (it doesn't to recruiters). Writing case studies feels like marketing rather than engineering. The PROJECT.md mentions "project detail/case study pages with technical depth" but the temptation is to treat these as spec sheets rather than stories.

**How to avoid:**
- Structure every project case study with a narrative arc: Problem (what needed solving) > Approach (what you chose and why) > Implementation (technical details for engineers) > Outcome (what changed) > Lessons (what you learned).
- Include at least one "decision I made and why" per project. This is the signal engineers look for.
- Include at least one "challenge I faced and how I solved it" per project. This demonstrates problem-solving.
- Keep the scan layer short (3-4 bullet points visible in the project card) with a "Read More" expansion for the full case study.

**Warning signs:**
- Project pages have no headings beyond "Overview" and "Tech Stack"
- Case studies are under 200 words
- No mention of tradeoffs, decisions, or challenges
- All projects presented at the same depth (should vary by significance)

**Phase to address:**
Content architecture phase (wireframe the case study template) and content writing phase (fill it in). The template structure should be defined during component design; actual content is a separate milestone.

---

### Pitfall 6: Font Loading Causes Visible Layout Shift

**What goes wrong:**
Custom web fonts load after initial render, causing text to reflow. A fallback system font renders first (FOUT - Flash of Unstyled Text) then gets replaced by the custom font with different metrics, causing visible jumping. Or worse, text is invisible until fonts load (FOIT - Flash of Invisible Text). This tanks the CLS (Cumulative Layout Shift) Core Web Vital and looks janky on first impression.

**Why it happens:**
Developers add Google Fonts or custom typefaces without considering loading strategy. Default browser behavior varies: some browsers hide text for up to 3 seconds waiting for fonts (FOIT), others show fallback then swap (FOUT). Neither is acceptable for a portfolio where first impressions matter.

**How to avoid:**
- Use `font-display: swap` as minimum baseline, but pair it with a size-matched fallback font to reduce layout shift.
- Preload critical fonts: `<link rel="preload" href="font.woff2" as="font" crossorigin>`.
- Limit to 2 font families maximum (the 40-portfolio review recommends max 2 fonts).
- Consider `font-display: optional` for non-critical font weights -- this eliminates layout shift entirely by only using the font if it is already cached.
- Self-host fonts rather than loading from Google Fonts CDN (eliminates DNS lookup and third-party connection).
- Use WOFF2 format exclusively (best compression, universal browser support).

**Warning signs:**
- Visible text jump/reflow on first page load
- CLS score above 0.1 in Lighthouse
- Multiple font files loading in Network tab waterfall
- Fonts loading from third-party CDN instead of same origin

**Phase to address:**
Foundation/styling phase. Font strategy must be decided when the design system is set up, not bolted on later.

---

### Pitfall 7: Images Destroy Performance

**What goes wrong:**
Project screenshots and hero images are served as unoptimized PNGs or JPEGs at their original resolution. A single 4MB hero image makes LCP exceed 5 seconds on mobile. No responsive images means a phone downloads the same 2400px-wide image as a desktop. No lazy loading means all images on the projects page load immediately, even those below the fold.

**Why it happens:**
Screenshots are taken at retina resolution and dropped directly into the site. Developers test on fast local connections and don't notice the 8-second mobile load time. Image optimization feels like a chore compared to writing components.

**How to avoid:**
- Use the framework's built-in image component (Next.js Image, Astro Image, etc.) which handles responsive sizing, format conversion, and lazy loading automatically.
- Serve WebP with AVIF as progressive enhancement and JPEG/PNG as fallback.
- Set explicit `width` and `height` attributes on all images to prevent CLS.
- Use `loading="lazy"` for below-fold images and `fetchpriority="high"` for the hero/LCP image.
- Compress all images. Target: no single image over 200KB for web display.
- Generate multiple sizes via srcset for responsive delivery.

**Warning signs:**
- Any image file over 500KB in the repo
- Network tab shows images totaling over 2MB on any single page
- LCP element is an image without `fetchpriority="high"`
- No `srcset` or `<picture>` elements in image markup

**Phase to address:**
Component development phase. Image handling must be built into the project/image component from the start, not retrofitted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded project data in components | Fast to build | Every content change requires code changes, redeployment | Never -- use a data file (JSON/MDX) from day one |
| Inline styles instead of design tokens | Quick visual tweaks | Inconsistent spacing, colors, typography across pages | Never -- set up tokens/variables in foundation phase |
| Skip responsive testing until "later" | Ship desktop version faster | Retrofit responsive is 3x harder than building mobile-first | Never -- mobile-first from the start |
| Single global CSS file | Simple mental model | Specificity wars, unintended side effects as site grows | Only acceptable if using utility-first CSS (Tailwind) |
| No content data schema | Less upfront work | Projects have inconsistent fields, missing data causes runtime errors | Never -- define the project data type/schema first |
| Copy-paste components instead of abstracting | Faster for 2 pages | 5 pages means 5 places to update the same layout bug | Acceptable for first 2, then refactor before adding more |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Custom domain DNS | Changing DNS records repeatedly (delays SSL cert by up to a week) | Configure DNS once correctly, wait 24-48 hours for propagation |
| Google Fonts | Loading via `<link>` from fonts.googleapis.com (extra DNS lookup, privacy concerns, potential GDPR issues) | Self-host WOFF2 files, preload critical fonts |
| Open Graph / social previews | Injecting OG tags via client-side JS (invisible to crawlers) | OG tags must be in server-rendered HTML head at build time |
| PDF resume download | Linking to Google Drive or Dropbox (ugly URL, can break, requires login) | Host PDF as a static asset in the site, use descriptive filename |
| Analytics (if added later) | Loading analytics script synchronously in `<head>` (blocks render) | Load async, defer to after page load, or use lightweight alternative like Plausible |
| GitHub API for project data | Fetching live GitHub data on each page load (rate limiting, slow, unnecessary) | Fetch at build time (SSG) and rebuild periodically, or just use static data |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized hero image | LCP > 4s on mobile, Lighthouse performance < 70 | WebP/AVIF, responsive srcset, fetchpriority="high" | Immediately on 3G/slow connections |
| Too many font weights loaded | 500KB+ of font files, render-blocking | Load max 2 weights per family, self-host WOFF2 | Noticeable on first visit (not cached) |
| No code splitting | 300KB+ JS bundle on every page | Framework-level route splitting, dynamic imports for heavy components | When site exceeds 3-4 pages with distinct content |
| CSS-in-JS runtime overhead | Delayed first paint, high INP on interactions | Use zero-runtime CSS (Tailwind, CSS Modules, vanilla-extract) or compile-time CSS-in-JS | Noticeable on lower-end mobile devices |
| Third-party script accumulation | TTI creeps up as analytics, chat widgets, tracking are added | Audit third-party scripts quarterly, lazy-load non-critical ones | After adding 3+ third-party scripts |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing email address as plain text in HTML | Spam harvesting bots scrape email from page source | Use `mailto:` link with light obfuscation, or link to LinkedIn/contact form instead |
| Leaving `.env` or API keys in public repo | Credential exposure if GitHub repo is public | Add `.env` to `.gitignore` before first commit, use environment variables on hosting platform |
| No Content-Security-Policy headers | XSS vulnerability if any user input is ever added (contact form, comments) | Set CSP headers on hosting platform, even for static sites it prevents injection via browser extensions |
| Serving over HTTP (no HTTPS) | Browser "Not Secure" warning, no trust from visitors, no HTTP/2 performance | All modern hosts (Vercel, Netlify, Cloudflare Pages) provide free HTTPS. Verify SSL is active after custom domain setup |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Skill percentage bars ("JavaScript: 85%") | Meaningless metric, universally mocked by experienced developers | Show skills through project context ("Built X using React and TypeScript") or list years/project count |
| Third-person bio ("Jack is a developer...") | Feels impersonal and odd on a personal site | First person ("I build...") creates connection per the 40-portfolio review |
| Burying contact info at bottom of page only | Recruiter who wants to reach out has to scroll/navigate to find contact | Place contact links in header/nav AND footer, make persistent |
| Identical project cards with no visual hierarchy | All projects look equally important, nothing stands out | Feature 1-2 top projects prominently, rest in a smaller grid |
| Required scrolljacking or horizontal scroll | Breaks expected browser behavior, frustrates users | Standard vertical scroll, reserve horizontal scroll only for image carousels if needed |
| No visible navigation on mobile | Users cannot find other pages | Persistent hamburger menu or bottom nav bar, always visible |
| Auto-playing video or audio | Jarring, often causes immediate bounce | Never auto-play media. Provide play controls if video is included |

## "Looks Done But Isn't" Checklist

- [ ] **Favicon:** Missing default favicon shows browser/framework icon -- verify custom favicon loads in multiple browsers
- [ ] **404 page:** Default framework 404 looks broken -- create a styled 404 with navigation back to home
- [ ] **Mobile nav:** Hamburger menu exists but doesn't close on link click, or traps focus
- [ ] **External links:** Links to GitHub/LinkedIn open in same tab (losing the portfolio) -- use `target="_blank"` with `rel="noopener noreferrer"`
- [ ] **PDF resume:** Download link works but PDF is outdated, unformatted, or has a generic filename like `resume(3).pdf`
- [ ] **Meta tags per page:** Only the homepage has proper title/description -- every page needs unique meta
- [ ] **Print stylesheet:** Resume page looks broken when printed -- add `@media print` styles
- [ ] **Contrast in both modes:** If dark mode exists, verify contrast ratios meet WCAG AA (4.5:1 for text) in BOTH modes
- [ ] **Touch targets:** Buttons and links are at least 44x44px on mobile (WCAG 2.5.8)
- [ ] **Image alt text:** Project screenshots have descriptive alt text, not empty strings or filenames
- [ ] **Trailing slash consistency:** URLs work with and without trailing slashes (or redirect consistently)
- [ ] **robots.txt and sitemap.xml:** Present and correct -- SSG frameworks often don't generate these by default

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Over-engineered animations | MEDIUM | Audit all animations, remove non-essential, measure performance before/after |
| Client-side rendering (SEO broken) | HIGH | Requires migrating to SSR/SSG framework -- nearly a rewrite if deeply CSR |
| Placeholder content live in production | LOW | Write real content for 2-3 projects (1-2 days), deploy immediately |
| Poor information hierarchy on homepage | LOW | Restructure hero section content (1-2 hours), no structural changes needed |
| Flat project showcases (no narrative) | MEDIUM | Write case studies (2-3 hours per project), may need to adjust component layout |
| Unoptimized images tanking performance | LOW | Run images through optimization pipeline, update components to use responsive images (half day) |
| Font loading layout shift | LOW-MEDIUM | Switch to self-hosted WOFF2, add preload hints, configure font-display (2-3 hours) |
| Missing SEO fundamentals (meta, OG, sitemap) | LOW | Add meta tags per page, generate sitemap, test social previews (half day) |
| Accessibility failures (contrast, alt text, focus) | MEDIUM | Audit with axe/Lighthouse, fix contrast ratios, add alt text, fix focus management (1-2 days) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Over-engineering / animation excess | Foundation: set performance budget and animation policy | Lighthouse performance > 95, no loading screen needed |
| SPA SEO trap | Tech stack selection: choose SSG/SSR framework | `curl` homepage returns full HTML content, not empty div |
| Placeholder content in production | Content phase: hard gate before deploy | CI check for placeholder markers, manual content review |
| Failed 10-second recruiter test | Layout/wireframe phase: validate information hierarchy | 5-second usability test with non-developer friend |
| Flat project showcases | Content architecture: define case study template | Each project page has Problem/Approach/Outcome sections |
| Font loading layout shift | Design system/foundation: font strategy | CLS < 0.1 in Lighthouse, no visible text reflow on hard refresh |
| Image performance | Component development: image handling | No image > 200KB served, LCP < 2.5s, all images have dimensions |
| Missing accessibility basics | Throughout, verified at polish phase | Lighthouse accessibility > 95, manual keyboard nav test |
| Missing SEO/meta/OG tags | Build phase, verified pre-deploy | Every page has unique title + description, social preview renders correctly |
| Security basics (HTTPS, CSP, no exposed secrets) | Deployment phase | SSL active, no secrets in repo, CSP header present |

## Sources

- [What I learned after reviewing over 40 developer portfolios (DEV Community)](https://dev.to/kethmars/what-i-learned-after-reviewing-over-40-developer-portfolios-9-tips-for-a-better-portfolio-4me7)
- [How to Build a Developer Portfolio That Actually Gets You Hired 2026 (DEV Community)](https://dev.to/__be2942592/how-to-build-a-developer-portfolio-that-actually-gets-you-hired-2026-6kn)
- [How to Build a Frontend Developer Portfolio in 2025 (DEV Community)](https://dev.to/siddheshcodes/frontend-developer-portfolio-tips-for-2025-build-a-stunning-site-that-gets-you-hired-3hga)
- [5 Most Common Developer Portfolio Mistakes (David Walsh)](https://davidwalsh.name/5-most-common-developer-portfolio-mistakes)
- [Junior Dev Resume & Portfolio in the Age of AI (DEV Community)](https://dev.to/dhruvjoshi9/junior-dev-resume-portfolio-in-the-age-of-ai-what-recruiters-care-about-in-2025-26c7)
- [Complete Guide: Building a Junior Developer Portfolio (webportfolios.dev)](https://www.webportfolios.dev/blog/junior-developer-portfolio-guide-2025)
- [Portfolio Mistakes Designers Still Make in 2026 (Muzli Blog)](https://muz.li/blog/portfolio-mistakes-designers-still-make-in-2026/)
- [Common SPA Crawling Issues & How To Fix Them (Lumar)](https://www.lumar.io/blog/best-practice/spa-seo/)
- [Fixing Layout Shifts Caused by Web Fonts (DebugBear)](https://www.debugbear.com/blog/web-font-layout-shift)
- [WCAG Color Contrast Accessibility Guidelines (WebAIM)](https://webaim.org/articles/contrast/)
- [Dark Mode Accessibility Best Practices (BOIA)](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements)
- [Image Performance (web.dev)](https://web.dev/learn/performance/image-performance)
- [Website Load Time Statistics 2026 (Hostinger)](https://www.hostinger.com/tutorials/website-load-time-statistics)
- [Lighthouse Performance Scoring (Chrome for Developers)](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)

---
*Pitfalls research for: Junior SWE portfolio website*
*Researched: 2026-03-22*
