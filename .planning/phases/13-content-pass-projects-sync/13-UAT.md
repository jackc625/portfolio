---
status: pending
phase: 13-content-pass-projects-sync
source:
  - 13-01-test-stubs-wave-zero-SUMMARY.md
  - 13-02-sync-infra-SUMMARY.md
  - 13-03-docs-and-roadmap-SUMMARY.md
  - 13-04-daytrade-rename-and-anchors-SUMMARY.md
  - 13-05-case-studies-batch-a-SUMMARY.md
  - 13-06-case-studies-batch-b-SUMMARY.md
  - 13-07-case-studies-batch-c-SUMMARY.md
started: 2026-04-19T19:34:42Z
updated: 2026-04-19T19:34:42Z
---

## Current Test

[all tests pending]

## Tests

### 1. Homepage Display Hero
expected: |
  Boot dev server (`pnpm dev`) and open http://localhost:4321. The `.display`
  element (src/pages/index.astro line 43-45) must render exactly:
    JACK
    CUTRARA.
  (two-line break via <br>, accent red period on "CUTRARA").

  The `.lead.hero-lead` paragraph (line 46-48) must read verbatim:
    "Software engineer building reliable, production-grade systems."

  No additional hype copy, no marketing adjectives, no version/date suffix.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 2. Homepage Status Dot
expected: |
  In the hero's aside region (src/pages/index.astro line 50-53) the
  StatusDot primitive must show exactly:
    "AVAILABLE FOR WORK"
  (all caps, monospace label-mono style, with the animated accent-colored
  dot glyph rendered to its left per StatusDot.astro).
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 3. Homepage Meta Label
expected: |
  In the hero aside directly below the status dot, the MetaLabel primitive
  (src/pages/index.astro line 52) must show exactly:
    "EST. 2026 · NORTHERN VA"
  (all caps, monospace, middle-dot separator U+00B7, color="ink-muted").
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 4. Homepage 3 Work-List Rows
expected: |
  Section "01 / WORK" renders exactly 3 WorkRow entries, in order, matching
  the 3 `featured: true` MDX frontmatters (src/pages/index.astro line 62-70
  maps `featured = allProjects.filter(p => p.data.featured)` sorted by order):

  Row 01 — SeatWatch (order: 1, year: 2025)
    title: "SeatWatch"
    stack (uppercase, middle-dot joined, from techStack):
      "TYPESCRIPT · REACT · EXPRESS · BULLMQ · POSTGRESQL · REDIS · PRISMA · STRIPE"
    href: /projects/seatwatch

  Row 02 — NFL Prediction System (order: 2, year: 2025)
    title: "NFL Prediction System"
    stack:
      "PYTHON · FASTAPI · XGBOOST · SCIKIT-LEARN · DUCKDB · HTMX · TAILWIND CSS"
    href: /projects/nfl-predict

  Row 03 — SolSniper (order: 3, year: 2025)
    title: "SolSniper"
    stack:
      "TYPESCRIPT · SOLANA/WEB3.JS · PREACT · SQLITE · FASTIFY · JUPITER API"
    href: /projects/solsniper

  Section-header count indicator must read "3 / 6".
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 5. Homepage About Strip
expected: |
  Section "02 / ABOUT" (src/pages/index.astro line 75-84) renders exactly two
  paragraphs followed by a "READ MORE →" link to /about.

  Paragraph 1 (class="about-intro", from ABOUT_INTRO in src/data/about.ts
  line 7-8) must read verbatim:
    "I'm Jack — a junior software engineer who likes building systems
    that don't break at 3 a.m."
  (em-dash is U+2014; the space between "3" and "a.m." is a non-breaking
  space U+00A0.)

  Paragraph 2 (class="body", from ABOUT_P1 src/data/about.ts line 11-12)
  must read verbatim:
    "I build small, production-grade services and the plumbing around them:
    caches, compilers, sync engines, APIs. Most of my projects start as
    "I wonder how that actually works" and end as something I'd be
    comfortable handing off to a team."
  (inner quotes are curly U+201C / U+201D; the apostrophe in "I'd" is
  U+2019.)

  The "READ MORE →" link text (line 81) must be all caps with a
  right-arrow U+2192.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 6. About Page Full Narrative
expected: |
  Open http://localhost:4321/about. The section renders exactly four
  paragraphs in order, verbatim from src/data/about.ts:

  ABOUT_INTRO (line 7-8, also rendered on homepage — must match Test 5):
    "I'm Jack — a junior software engineer who likes building systems
    that don't break at 3 a.m."

  ABOUT_P1 (line 11-12, also rendered on homepage — must match Test 5):
    "I build small, production-grade services and the plumbing around them:
    caches, compilers, sync engines, APIs. Most of my projects start as
    "I wonder how that actually works" and end as something I'd be
    comfortable handing off to a team."

  ABOUT_P2 (line 15-16):
    "I reach for the boring tool first. I read the spec before I read
    the blog post. I like tests that fail loudly and code review comments
    that start with "why." My favorite bug reports are the ones that
    come with a reproduction."

  ABOUT_P3 (line 19-20):
    "Right now I'm looking for a junior or entry-level role on a team
    that cares about correctness, reliability, and performance — ideally
    one that will push me to get better at the parts of the stack I
    haven't touched yet."

  Every `export const ABOUT_*` line has a `/* Verified: 2026-04-19 */`
  comment above it (D-18). If Jack edits any string during this UAT,
  refresh the adjacent Verified: comment to today's date.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 7. Project Detail Page — /projects/clipify
expected: |
  Open http://localhost:4321/projects/clipify. Verify the rendered page
  against src/content/projects/clipify.mdx frontmatter (lines 1-22):

  title: "Clipify"
  tagline: "AI video clipping from long-form content to social-ready clips"
  year: "2024"
  techStack: ["Next.js", "TypeScript", "OpenAI Whisper", "GPT-4o",
              "BullMQ", "FFmpeg", "AWS S3", "Stripe"]
  githubUrl: (absent — no GitHub link rendered)
  demoUrl: (absent — no demo link rendered)
  status: "completed"
  category: "web-app"
  order: 5
  featured: false

  Body has exactly 5 H2s in D-01 order, with NO extra H2s:
    ## Problem
    ## Approach & Architecture
    ## Tradeoffs
    ## Outcome
    ## Learnings

  Body word count = 887 words (within 600-900 target band). Voice matches
  first-person engineering-journal tone (VOICE-GUIDE.md); no banned hype
  words ("revolutionary", "seamless", "leverage", "robust" unqualified,
  "dive deeper", emoji). Links (if any githubUrl/demoUrl were present)
  would resolve without 404.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 8. Project Detail Page — /projects/daytrade
expected: |
  Open http://localhost:4321/projects/daytrade. Verify URL slug is
  `daytrade` (not `crypto-breakout-trader` — Plan 04 renamed). Verify
  against src/content/projects/daytrade.mdx frontmatter (lines 1-12):

  title: "Daytrade"
  tagline: "Momentum breakout bot with composable filters and risk controls"
  year: "2025"
  techStack: ["Python", "CCXT", "pandas", "pandas-ta", "Pydantic"]
  githubUrl: (absent)
  demoUrl: (absent)
  status: "completed"
  category: "other"
  order: 6
  featured: false

  Body has exactly 5 H2s in D-01 order (Problem, Approach & Architecture,
  Tradeoffs, Outcome, Learnings). Body word count = 888 words. The old
  slug `/projects/crypto-breakout-trader` must 404 (no redirect per D-05).
  Voice matches first-person engineering-journal tone; no banned hype.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 9. Project Detail Page — /projects/nfl-predict
expected: |
  Open http://localhost:4321/projects/nfl-predict. Verify against
  src/content/projects/nfl-predict.mdx frontmatter (lines 1-21):

  title: "NFL Prediction System"
  tagline: "ML-powered game predictions with walk-forward backtesting"
  year: "2025"
  techStack: ["Python", "FastAPI", "XGBoost", "scikit-learn", "DuckDB",
              "HTMX", "Tailwind CSS"]
  githubUrl: (absent)
  demoUrl: (absent)
  status: "completed"
  category: "web-app"
  order: 2
  featured: true  (appears on homepage Row 02 — cross-check Test 4)

  Body has exactly 5 H2s in D-01 order. Body word count = 886 words.
  Voice matches first-person engineering-journal tone; no banned hype.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 10. Project Detail Page — /projects/optimize-ai
expected: |
  Open http://localhost:4321/projects/optimize-ai. Verify against
  src/content/projects/optimize-ai.mdx frontmatter (lines 1-13):

  title: "Optimize AI"
  tagline: "Full-stack fitness tracking with database-level data isolation"
  year: "2024"
  techStack: ["Next.js", "React", "TypeScript", "Supabase", "PostgreSQL",
              "Tailwind CSS"]
  githubUrl: (absent)
  demoUrl: (absent)
  status: "completed"
  category: "web-app"
  order: 4
  featured: false

  Body has exactly 5 H2s in D-01 order. Body word count = 888 words.
  Voice matches first-person engineering-journal tone; no banned hype.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 11. Project Detail Page — /projects/seatwatch
expected: |
  Open http://localhost:4321/projects/seatwatch. Verify against
  src/content/projects/seatwatch.mdx frontmatter (lines 1-23):

  title: "SeatWatch"
  tagline: "Automated restaurant reservations with dual-strategy booking"
  year: "2025"
  techStack: ["TypeScript", "React", "Express", "BullMQ", "PostgreSQL",
              "Redis", "Prisma", "Stripe"]
  githubUrl: (absent)
  demoUrl: "https://seat.watch"  (must render as clickable link, opens
          new tab, does not 404)
  status: "completed"
  category: "web-app"
  order: 1
  featured: true  (appears on homepage Row 01 — cross-check Test 4)

  Body has exactly 5 H2s in D-01 order. Body word count = 843 words
  (canonical voice exemplar per D-10). Voice matches first-person
  engineering-journal tone; named systems ("dual-strategy booking engine",
  "distributed booking lock", "per-user circuit breaker", "26-profile
  browser identity pool"); no banned hype.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 12. Project Detail Page — /projects/solsniper
expected: |
  Open http://localhost:4321/projects/solsniper. Verify against
  src/content/projects/solsniper.mdx frontmatter (lines 1-13):

  title: "SolSniper"
  tagline: "Real-time Solana token sniping with multi-tier safety analysis"
  year: "2025"
  techStack: ["TypeScript", "Solana/web3.js", "Preact", "SQLite",
              "Fastify", "Jupiter API"]
  githubUrl: (absent)
  demoUrl: (absent)
  status: "completed"
  category: "other"
  order: 3
  featured: true  (appears on homepage Row 03 — cross-check Test 4)

  Body has exactly 5 H2s in D-01 order. Body word count = 887 words.
  Voice matches first-person engineering-journal tone; no banned hype.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 13. Resume PDF (public/jack-cutrara-resume.pdf)
expected: |
  Open public/jack-cutrara-resume.pdf in a PDF viewer (current file:
  134,249 bytes, last modified 2026-04-13). Verify page-by-page that the
  content still reflects Jack's current state as of 2026-04-19:

  - Name + title + contact block (email, GitHub, LinkedIn, site URL)
    match src/data/contact.ts values exactly
  - Education (Western Governors University, 2026) matches
    portfolio-context.json
  - Skills list (languages, frameworks, databases, tools) matches
    portfolio-context.json line 13-18
  - Projects section includes the 6 v1.2 projects (SeatWatch, NFL
    Prediction System, SolSniper, Optimize AI, Clipify, Daytrade) —
    NOT the old "Crypto Breakout Trader" name
  - Each project blurb is truthful (no obsolete claims, no since-changed
    tech stack)
  - Dates / timeline are current (no "coming 2025" language that has
    since aged)

  If ANY content is outdated: Jack re-exports from the external source
  doc per D-19 (Google Docs / LaTeX → PDF → overwrite
  public/jack-cutrara-resume.pdf → commit). If Jack opts to defer the
  re-export, mark result: skipped with reason explaining the deferral.

  If content is current as-is: mark passed.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

### 14. Contact Section Links
expected: |
  Open http://localhost:4321/#contact (or scroll to the homepage contact
  section, ContactSection.astro via src/pages/index.astro line 86-90).
  Verify each rendered link against src/data/contact.ts (line 6-17):

  - EMAIL row: label "EMAIL", href `mailto:jackcutrara@gmail.com`,
    clicking opens the system mail composer
  - GITHUB row: label "GITHUB", href `https://github.com/jackc625`,
    resolves to Jack's GitHub profile (200 OK, opens in new tab with
    rel="noopener noreferrer")
  - LINKEDIN row: label "LINKEDIN", href
    `https://linkedin.com/in/jackcutrara`, resolves to Jack's LinkedIn
    profile (200 OK, opens in new tab)
  - X row: MUST NOT RENDER (contact.x is `null`; consumers skip null
    entries silently per the data-layer contract)
  - RESUME row: label "RESUME", href `/jack-cutrara-resume.pdf`,
    download-attribute set, clicking downloads the PDF verified in
    Test 13

  No 404s, no placeholder URLs, no stale social handles.
result: pending
reported: ""
severity: ""
evidence: |
fix: |

## Summary

total: 14
passed: 0
issues: 0
fixed: 0
pending: 14
skipped: 0
