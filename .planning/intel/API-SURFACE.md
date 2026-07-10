# API Surface

> Generated from `.planning/intel/api-map.json`. Do not edit by hand.

## `POST /api/chat`

- **method:** POST
- **path:** /api/chat
- **params:** messages, sessionId
- **file:** `src/pages/api/chat.ts`
- **description:** SSR (prerender=false) Cloudflare Workers endpoint. Streams Anthropic Claude Haiku 4.5 replies as SSE (text/event-stream). Enforces CORS origin whitelist, 32KB body cap, Cloudflare rate limiter, Zod validation, message sanitization, and fire-and-forget KV transcript persistence via appendTurn.

## `GET /`

- **method:** GET
- **path:** /
- **file:** `src/pages/index.astro`
- **description:** Static homepage. Renders 3 featured projects, about intro, contact section, and Person/WebSite JSON-LD.

## `GET /about`

- **method:** GET
- **path:** /about
- **file:** `src/pages/about.astro`
- **description:** Static about page.

## `GET /projects`

- **method:** GET
- **path:** /projects
- **file:** `src/pages/projects.astro`
- **description:** Static projects index, ordered by project.order ascending.

## `GET /projects/[id]`

- **method:** GET
- **path:** /projects/[id]
- **params:** id
- **file:** `src/pages/projects/[id].astro`
- **description:** Static project case study pages generated via getStaticPaths from the projects content collection. Renders MDX Content plus wrap-around NextProject navigation.

## `GET /experience`

- **method:** GET
- **path:** /experience
- **file:** `src/pages/experience.astro`
- **description:** Static two-tier experience listing. Tier 1 renders the single hasCaseStudy entry (Holloway) as a rich featured summary with highlights and a deep-dive link; tier 2 lists the non-linked "Earlier" entries. Ordered reverse-chronologically (startDate desc) via `sortExperienceEntries`. Build fails loudly if the collection invariants (exactly one hasCaseStudy entry with id "holloway", at least one earlier entry) are violated.

## `GET /experience/[id]`

- **method:** GET
- **path:** /experience/[id]
- **params:** id
- **file:** `src/pages/experience/[id].astro`
- **description:** Static experience case-study detail route. getStaticPaths builds a path ONLY for hasCaseStudy entries (yields just `/experience/holloway`; Balfour generates no route). Renders MDX Content in a `.prose-editorial` wrapper with top/bottom back-links and scroll-depth sentinels. Meta description falls back to `summary` when frontmatter `description` is absent.

## `GET /contact`

- **method:** GET
- **path:** /contact
- **file:** `src/pages/contact.astro`
- **description:** Static contact page.

## `GET /404`

- **method:** GET
- **path:** /404
- **file:** `src/pages/404.astro`
- **description:** Static 404 not-found page.

## `scheduled() cron`

- **method:** CRON
- **path:** worker.scheduled
- **params:** controller, env, ctx
- **file:** `src/worker.ts`
- **description:** Cloudflare Workers scheduled() handler dispatching deliverDue for the transcript delivery cron sweep (live: -> delivered: keyspace partition, DRY_RUN-gated Resend email).

## Module exports

### `sortExperienceEntries()`

- **file:** `src/lib/experience.ts`
- **params:** entries
- **description:** Reusable reverse-chronological ordering helper. Returns a new array of experience entries sorted by `data.startDate` descending. Structural generic, imports nothing from astro:content so it stays Vitest-testable. Consumed by both `experience.astro` and `experience/[id].astro`.

### `sync-experience` helpers

- **file:** `scripts/sync-experience.mjs`
- **exports:** `normalize`, `readSourceField`, `sliceFrontmatter`, `extractFence`
- **description:** Source-of-truth sync CLI + testable helpers. Extracts fenced case-study prose (CASE-STUDY-START/END) from `Experience/*.md` into `src/content/experience/*.mdx` bodies, preserving frontmatter byte-for-byte. Includes a path-traversal guard. `--check` mode is the CI drift gate (`sync:experience:check`).
