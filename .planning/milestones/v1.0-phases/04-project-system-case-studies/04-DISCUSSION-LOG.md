# Phase 4: Project System & Case Studies - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 04-project-system-case-studies
**Areas discussed:** Project card presentation, Case study page layout, Thumbnails & visual media, Case study content, URL structure & routing, Projects page header/intro, Mobile responsiveness, Filtering or sorting

---

## Project Card Presentation

### Layout approach
| Option | Description | Selected |
|--------|-------------|----------|
| Editorial list (Recommended) | Text-only rows matching shiyunlu.com's aesthetic. Thumbnails only on case study detail pages. | |
| Card grid with thumbnails | 2-3 column image cards. More visual but diverges from reference site. | |
| Hybrid — featured + list | Top 2-3 projects as large image cards, rest as editorial list rows. Visual hierarchy for best work. | ✓ |

**User's choice:** Hybrid — featured + list
**Notes:** None

### Featured count
| Option | Description | Selected |
|--------|-------------|----------|
| 2 projects (Recommended) | Keeps featured section tight and impactful. | |
| 3 projects | Slightly more visual weight at the top. | ✓ |

**User's choice:** 3 projects
**Notes:** None

### Total project count
| Option | Description | Selected |
|--------|-------------|----------|
| 5 projects | Minimum from requirements. 3 featured + 2 in list. | |
| 6 projects (Recommended) | Upper end of spec. 3 featured + 3 in list. | |
| You decide | Claude picks based on what looks right. | ✓ |

**User's choice:** You decide
**Notes:** None

### Category labels
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — mono label (Recommended) | Small uppercase monospace label above title. | |
| No labels | Just title, tagline, tech tags, and thumbnail. | ✓ |

**User's choice:** No labels
**Notes:** None

### Status badges
| Option | Description | Selected |
|--------|-------------|----------|
| No — hide status (Recommended) | Cleaner cards. "In-progress" could signal unfinished work. | ✓ |
| Yes — subtle badge | Small indicator on in-progress projects. | |

**User's choice:** No — hide status
**Notes:** None

### Inline links
| Option | Description | Selected |
|--------|-------------|----------|
| Only on case study page | List items link to case study only. Keeps list clean. | ✓ |
| Inline icon links | Small GitHub/demo icons on each list row. | |

**User's choice:** Only on case study page
**Notes:** None

---

## Case Study Page Layout

### Progressive disclosure
| Option | Description | Selected |
|--------|-------------|----------|
| Hero summary + scroll sections (Recommended) | Top section with title, tech tags, links, hero image. Sections scroll below. | ✓ |
| Two-column — sidebar + content | Sticky sidebar with section links on left, content scrolls on right. | |

**User's choice:** Hero summary + scroll sections
**Notes:** None

### Template sections
| Option | Description | Selected |
|--------|-------------|----------|
| Problem | What challenge the project addresses. | ✓ |
| Solution & approach | How it was built — architecture, key decisions. | ✓ |
| Challenges & lessons | What was hard and what was learned. Combined section. | ✓ |
| Tech stack detail | Dedicated section with tech choices and rationale. | ✓ |

**User's choice:** All four sections
**Notes:** None

### Results section
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — separate section | Dedicated section for metrics/impact. | |
| Fold into Challenges & Lessons | Keep results as part of takeaways. | |
| You decide per project | Include only when meaningful metrics exist. | ✓ |

**User's choice:** You decide per project
**Notes:** None

### Next/previous navigation
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — next project link (Recommended) | "Next project" link at bottom keeps readers flowing. | ✓ |
| Back to projects only | Just a link back to projects listing. | |

**User's choice:** Yes — next project link
**Notes:** None

### Hero image placement
| Option | Description | Selected |
|--------|-------------|----------|
| Large hero image (Recommended) | Full-width project screenshot below title area. | ✓ |
| Text-focused hero | Hero is just title/tagline/tags. First image appears further down. | |

**User's choice:** Large hero image
**Notes:** None

### Section styling
| Option | Description | Selected |
|--------|-------------|----------|
| Match Phase 3 pattern (Recommended) | Mono uppercase labels with asymmetric grid. Consistent with other pages. | ✓ |
| Simpler — just headings | Standard heading + paragraph flow. | |

**User's choice:** Match Phase 3 pattern
**Notes:** None

---

## Thumbnails & Visual Media

### Thumbnail type
| Option | Description | Selected |
|--------|-------------|----------|
| Real screenshots (Recommended) | Actual screenshots of project UI/output. | ✓ |
| Styled mockups | Screenshots in browser/device frames. | |
| Abstract placeholder art | Geometric/gradient images. | |

**User's choice:** Real screenshots
**Notes:** None

### Placeholder treatment
| Option | Description | Selected |
|--------|-------------|----------|
| Solid color + project title | Dark card with centered title. Minimal, easy to swap. | ✓ |
| Gradient abstract | Dark gradient or subtle pattern per project. | |

**User's choice:** Solid color + project title
**Notes:** None

### Media in case studies
| Option | Description | Selected |
|--------|-------------|----------|
| Full-width images between sections | Images span full content width. Bold, editorial. | |
| Inline with text | Images alongside paragraphs. More conversational. | |
| You decide | Claude picks the treatment. | ✓ |

**User's choice:** You decide
**Notes:** None

### Thumbnail schema
| Option | Description | Selected |
|--------|-------------|----------|
| Required (keep current) | Every project must have a thumbnail. | |
| Make optional | Graceful fallback to placeholder. | ✓ |

**User's choice:** Make optional
**Notes:** None

### Image captions
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — simple caption below | Small muted text below images. | ✓ |
| No captions | Images stand on their own. | |

**User's choice:** Yes — simple caption below
**Notes:** None

### Hero aspect ratio
| Option | Description | Selected |
|--------|-------------|----------|
| 16:9 landscape (Recommended) | Standard widescreen. Predictable across projects. | ✓ |
| Flexible — any ratio | Each project uses whatever ratio fits. | |

**User's choice:** 16:9 landscape
**Notes:** None

---

## Case Study Content

### Project selection
| Option | Description | Selected |
|--------|-------------|----------|
| This portfolio site | Meta case study. | |
| I'll list my projects | User provides real project list. | |
| Use placeholder for now | Realistic but fictional case studies. | ✓ |

**User's choice:** Use placeholder for now
**Notes:** None

### Placeholder themes
| Option | Description | Selected |
|--------|-------------|----------|
| Varied — web app + API/CLI (Recommended) | One frontend, one backend. Shows range. | |
| All web apps | Both as web apps. | |
| You decide | Claude picks. | |

**User's choice:** Other — "Doesn't matter at all. This is literally a temporary placeholder."
**Notes:** User emphasized this is purely structural placeholder content.

### Writing tone
| Option | Description | Selected |
|--------|-------------|----------|
| First-person conversational (Recommended) | Matches About page tone. "I built this because..." | ✓ |
| Third-person professional | "This project addresses..." More formal. | |

**User's choice:** First-person conversational
**Notes:** None

### Case study length
| Option | Description | Selected |
|--------|-------------|----------|
| Short — ~500 words | Quick read, 2-minute skim. | |
| Medium — ~1000 words (Recommended) | Substantial, 5-minute read. | |
| You decide | Claude picks per project. | ✓ |

**User's choice:** You decide
**Notes:** None

### Code snippets
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — 1-2 key snippets (Recommended) | Highlight key decisions with code blocks. | |
| No code snippets | Prose only. Engineers check GitHub. | ✓ |

**User's choice:** No code snippets
**Notes:** None

### Schema updates
| Option | Description | Selected |
|--------|-------------|----------|
| Make thumbnail optional only | Only discussed change. | |
| Add new fields | User specifies additional fields. | |
| You decide | Claude adjusts as needed. | ✓ |

**User's choice:** You decide
**Notes:** None

---

## URL Structure & Routing

### URL pattern
| Option | Description | Selected |
|--------|-------------|----------|
| /projects/[slug] (Recommended) | Clean, readable, SEO-friendly. | ✓ |
| /projects/[id] | Shorter but less descriptive. | |

**User's choice:** /projects/[slug]
**Notes:** None

### Slug source
| Option | Description | Selected |
|--------|-------------|----------|
| MDX filename (Recommended) | Astro default behavior. Simple. | ✓ |
| Frontmatter slug field | More control but extra maintenance. | |

**User's choice:** MDX filename
**Notes:** None

---

## Projects Page Header/Intro

| Option | Description | Selected |
|--------|-------------|----------|
| Title + one-line subtitle | "Projects" + brief subtitle. | |
| Title only | Ultra-minimal. | |
| Title + short paragraph | Heading + 1-2 sentences. | |
| You decide | Claude matches inner page pattern. | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Mobile Responsiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Stack to single column (Recommended) | Full-width cards stacked vertically on mobile. | ✓ |
| Horizontal scroll carousel | Swipeable row. Saves vertical space. | |

**User's choice:** Stack to single column
**Notes:** None

---

## Filtering or Sorting

| Option | Description | Selected |
|--------|-------------|----------|
| No filtering — fixed order (Recommended) | Manual order. With 5-6 projects, filtering adds complexity without value. | ✓ |
| Simple category tabs | Filter by category. May feel empty per category. | |

**User's choice:** No filtering — fixed order
**Notes:** ENHP-01 (project filtering) already deferred to v2.

---

## Claude's Discretion

- Total project count (5-6 range)
- Projects page intro text and layout
- Placeholder project themes, types, content, and length
- Media placement within case study sections
- Results/Outcome section inclusion per project
- Schema field additions beyond making thumbnail optional

## Deferred Ideas

- Project filtering by category/tech (ENHP-01, v2)
- Interactive embedded demos (ENHP-02, v2)
- Code snippets in case studies (user chose prose-only for v1)
