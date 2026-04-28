# Phase 15: Analytics Instrumentation - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Instrument cookie-free, consent-free recruiter-engagement telemetry on
`jackcutrara.com` only. Primary: Umami Cloud (free tier) via a single
production-gated `<script>` in `BaseLayout`. Secondary: Cloudflare Web Analytics
enabled via the CF dashboard for Core Web Vitals. New `src/scripts/analytics.ts`
module owns:

1. Listening to the existing `chat:analytics` `CustomEvent` (Phase 7 D-36
   content-free payload — already dispatched from `src/scripts/chat.ts:380`) and
   forwarding every action to Umami via `umami.track(action, metadata)`.
2. A delegated document-level click listener that classifies outbound anchors
   and emits a single `outbound_click` event with discriminating metadata,
   with an early return for `/jack-cutrara-resume.pdf` that emits
   `resume_download` instead (no double-count).
3. An `IntersectionObserver` scroll-depth tracker scoped to `/projects/[id]`
   detail pages only, firing `scroll_depth` at 25/50/75/100% of `<article>`
   with per-page-view one-shot semantics.
4. A small SSE-frame parser bolted into `src/scripts/chat.ts` (client-side
   only) that recognizes the server's existing `{"truncated": true}` diagnostic
   frame and dispatches a `chat:analytics` event with `action='chat_truncated'`,
   completing the Phase 14 gap-closure 14-07 observability seam.

**In scope:**
- `src/layouts/BaseLayout.astro` — Umami `<script>` insert after `<SEO />` in
  `<head>`, gated by `import.meta.env.PROD && data-domains="jackcutrara.com"`,
  async+defer, static `data-website-id` literal
- Cloudflare Pages dashboard — enable CF Web Analytics (non-code, non-commit)
  for Core Web Vitals (ANAL-02)
- `src/scripts/analytics.ts` (new) — chat:analytics forwarder + delegated
  outbound/resume listener
- `src/scripts/motion.ts` or similar (new) — IntersectionObserver scroll-depth
  tracker for `/projects/[id]`
- `src/pages/projects/[id].astro` — 4 sentinel `<div>`s at 25/50/75/100% of
  `<article>` (computed via CSS `top` inside a relative-positioned parent), or
  equivalent structural placement
- `src/scripts/chat.ts` (client only) — tiny additive diff: parse `truncated:
  true` SSE frame, dispatch `chat:analytics` with action `chat_truncated`
- `tests/client/analytics.test.ts` (or similar) — test the chat:analytics
  forwarder, outbound classification, resume-dedup, scroll-observer one-shot

**Out of scope (handled by other phases, or explicitly deferred):**
- Cache-hit-rate observability (`cache_read_input_tokens` /
  `cache_creation_input_tokens`) — deferred entirely to v1.3+ (see Deferred)
- Motion layer (`src/scripts/motion.ts` IntersectionObserver usage *for visual
  reveals*) — Phase 16. Phase 15 scroll-depth observer is logically separate
  but can share the file if the planner sees a clean factoring
- Any `src/pages/api/chat.ts` (server) change — byte-identical, no D-26 gate
  on the server side for Phase 15
- Cookie consent banner — ANAL-06 is satisfied by Umami + CF being cookie-free
  by design; no UI work needed
- Plausible migration / self-hosted Umami / analytics vendor swap — Umami
  Cloud free tier is locked per REQUIREMENTS.md ANAL-01
- Chat rate-limiter binding configuration (Phase 14 deferred todo at
  `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`)
  — orthogonal to analytics

</domain>

<decisions>
## Implementation Decisions

### Umami + CF Web Analytics placement

- **D-01:** **Belt-and-suspenders production gating** —
  `import.meta.env.PROD && <script ... data-domains="jackcutrara.com" />`.
  Script literally not in HTML on dev or preview builds; even if the Umami ID
  ever leaked into a non-prod build, Umami's server-side `data-domains` filter
  drops events from mismatched hostnames. Preview subdomains
  (`*.portfolio-5wl.pages.dev`) stay silent by default. No per-env var needed.
- **D-02:** **Script placement = `<head>` after `<SEO />`, async+defer.** Both
  the Umami tag (Phase 15 inserts) and the Cloudflare Web Analytics beacon
  (auto-injected by the CF proxy per D-04) land in `<head>` after the SEO
  component and before the `<Font>` preloads. `async` + `defer` so parsing
  never blocks. Lighthouse Performance gate (≥99) holds.
- **D-03:** **`data-website-id` is a committed static literal** in
  `BaseLayout.astro`. Umami website IDs are public (visible in HTML to every
  visitor) — no secret. Matches the CF beacon token pattern. One fewer env
  var to manage on Cloudflare Pages.
- **D-04:** **CF Web Analytics = enable-via-CF-dashboard, no BaseLayout
  script.** Cloudflare Pages toggles Web Analytics per-project; the beacon
  (`cloudflareinsights.com/beacon.min.js`) is auto-injected by the proxy for
  `jackcutrara.com`. Zero BaseLayout change for ANAL-02. Zero chance the
  beacon ships on preview subdomains. Task for planner: enable the toggle and
  capture a dashboard-URL screenshot in `15-VERIFICATION.md`.

### Scroll-depth strategy

- **D-05:** **Scope = `/projects/[id]` detail pages only** (ANAL-05 literal
  "project-page scroll depth"). Detail pages carry the 600–900-word case
  studies — the only surfaces where "scrolled past 75%" has signal. Homepage
  (short editorial) and `/projects` (numbered list index) are out; About
  narrative is close but not required by ANAL-05. Smaller surface = cleaner
  event count + less test burden.
- **D-06:** **4 sentinel `<div>`s at 25/50/75/100% of `<article>`**, single
  `IntersectionObserver` watching all four. Net-new pattern — grep confirms
  no existing `IntersectionObserver` in `src/`. Textbook GA4/Umami pattern;
  survives reflow (sentinels are positioned by CSS percent not JS math);
  works for any case-study length. Emits `scroll_depth` events with
  `{percent: 25|50|75|100, slug}` metadata.
- **D-07:** **Fire when sentinel top enters viewport** (threshold 0 or tiny).
  Natural "crossed this point" semantics; tolerant of tall sentinels on short
  mobile viewports; doesn't need finicky `rootMargin` tuning. The `100%`
  sentinel is a sliver at the bottom of `<article>` — entering viewport
  means the reader reached the end.
- **D-08:** **Per-page-view dedup via `observer.unobserve(entry.target)` on
  fire.** Each navigation to a project page fires each of 4 events at most
  once; reloads refire (matches GA4 scroll-depth semantics and Umami
  dashboard expectations). No `sessionStorage` overhead.

### Outbound dedup + event taxonomy

- **D-09:** **`/jack-cutrara-resume.pdf` fires `resume_download` only.** The
  delegated click listener checks `.pdf` extension first, emits
  `resume_download` with `{source: <page path>}` metadata, and **returns
  early** — never reaches the generic `outbound_click` path. Rationale: there
  is exactly one PDF on the site; firing both would double-count the single
  most important recruiter signal.
- **D-10:** **Single `outbound_click` event with `{type, href}` metadata.**
  `type` ∈ `{github, linkedin, email, external, pdf}` — discriminated by
  `href` prefix / hostname. Umami dashboards can filter/group on metadata.
  Matches Umami's "avoid near-duplicate event names" guidance. Minimal event
  surface; queryable at dashboard time.
- **D-11:** **`analytics.ts` forwards all 4 existing `chat:analytics`
  actions** to Umami: `chat_open`, `message_sent`, `chip_click`, `chat_error`.
  Content-free payload per Phase 7 D-36 is preserved. `action` maps to the
  Umami event name; `label` (when present — `chip_click` carries curated chip
  text, `chat_error` carries `"offline"` or error type) maps to metadata.
  Gives the full chat funnel (open → chip or message → errors), not just the
  top-of-funnel ANAL-05 named.
- **D-12:** **Href metadata policy = hostname + pathname only.** Strip query
  strings and fragments before storing in Umami metadata (`new URL(href);
  url.search = ""; url.hash = ""` pattern). `mailto:` anchors store the
  literal string `"mailto"` in metadata — never the email address, even
  though `CONTACT.email` is public. Preserves Phase 7 D-36 "content-free"
  discipline against future drift. Hostname+path gives per-repo granularity
  ("github.com/jackc625/seatwatch" not just "github.com").

### Chat observability in Phase 15

- **D-13:** **Cache-hit-rate observability DEFERRED entirely to v1.3+.** Phase
  14 D-13 already deferred it; the STATE.md claim that `chat-cache.ts` +
  `content-snapshot.ts` carry log seams overstated the shipped code — those
  files don't exist in `src/`. Wiring it now would require net-new chat.ts
  (server) code to intercept the Anthropic SDK's `message_start` event and
  emit a new SSE diagnostic frame. Out-of-proportion for portfolio-scale
  traffic. Captured in Deferred Ideas + a backlog todo.
- **D-14:** **Wire the existing `chat.truncated` seam to Umami.** Phase 14
  gap-closure 14-07 shipped a server-side `console.warn("chat.truncated",
  ...)` + an SSE `{"truncated": true}` diagnostic frame, with an inline code
  comment explicitly naming Phase 15 ANAL-03 as the wirer
  (`src/pages/api/chat.ts:119-124`). Client-side `src/scripts/chat.ts`
  currently does NOT parse the frame — Phase 15 adds a tiny additive parser
  that, on seeing `truncated: true`, dispatches the existing `chat:analytics`
  `CustomEvent` with `action='chat_truncated'`. That action rides D-11's
  all-actions forwarder into Umami with zero new event infrastructure — it
  is the 5th chat action, shaped identically to the other four.
- **D-15:** **chat.ts change budget = client-only, additive.**
  `src/pages/api/chat.ts` (server) stays **byte-identical**. Only
  `src/scripts/chat.ts` (client) gains a few lines to parse the `truncated`
  SSE frame. D-26 Chat Regression Gate runs on the **client surface only**:
  markdown rendering, clipboard parity, focus trap, localStorage persistence,
  SSE frame parsing, line-by-line delta. Server invariants (CORS, rate limit,
  body size, validation, 30s AbortController, streaming shape) are
  untouched — lowest-risk D-26 surface possible.

### Claude's Discretion

- Exact filename and layout for the new analytics module — `src/scripts/
  analytics.ts` is the natural name, but the planner may factor the
  scroll-depth observer into its own file (e.g., `src/scripts/scroll-depth.ts`)
  or fold it under a Phase 16 `src/scripts/motion.ts` if clean.
- Exact sentinel markup for scroll-depth (empty `<div>` vs `<span aria-hidden>`
  vs data-attribute) — planner picks for accessibility/semantics. Either
  works.
- Outbound-link classification heuristic — hostname match against a small
  static allow-list (`github.com`, `linkedin.com`, etc.) vs pattern-based
  (mailto: → email; .pdf → pdf; *.com with external protocol → external).
  Planner decides based on test ergonomics.
- Whether the delegated outbound listener mounts at `document.body` or on a
  layout-specific root — planner decides based on SSR hydration timing.
- Dashboard / Umami-site setup (creating the Umami website entry, grabbing
  the `data-website-id`, enabling CF Web Analytics on the Pages project) —
  handled by Jack operationally during execution; planner documents as a
  pre-deploy checklist in `15-VERIFICATION.md`.
- Exact event-name casing for `chat_truncated` vs `chat:truncated` vs
  `chatTruncated` — snake_case per D-11 precedent is the recommendation, but
  planner confirms against the shipped chat.ts dispatcher (`chat_open`,
  `message_sent`, etc. — all snake_case).
- Whether `analytics.ts` exports a typed `track(event, metadata)` wrapper or
  calls `window.umami?.track` directly — planner decides; the wrapper is
  nicer for tests.
- CF Web Analytics token handling — if the CF dashboard-only path (D-04)
  turns out to require a manual `<script>` tag for Pages projects without
  orange-cloud proxying, the planner falls back to the "explicit `<script>`
  in BaseLayout with same PROD gate as Umami" path. Research/execute will
  confirm.

### Folded Todos

*None folded — the only pending todo (`2026-04-23-configure-chat-rate-limiter-binding.md`)
is orthogonal to analytics (a rate-limiter config gap, not observability).*

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope

- `.planning/ROADMAP.md` §Phase 15, §Cross-Phase Constraints — ANAL-01..06
  requirements, D-26 Chat Regression Gate (applies to ANAL-01 BaseLayout
  `<script>` + ANAL-03 chat:analytics forwarder), Lighthouse CI Gate, zero
  new runtime dependencies
- `.planning/REQUIREMENTS.md` — ANAL-01..06 definitions (Phase 15 requirement
  block)
- `.planning/PROJECT.md` — core value (recruiter-engagement measurement is a
  credibility signal, not vanity metrics), audience framing

### Prior phase context (carry-forward decisions)

- `.planning/milestones/v1.0-phases/07-chatbot-feature/07-CONTEXT.md` — Phase
  7 D-36 content-free `chat:analytics` CustomEvent contract (carries forward)
- `.planning/phases/14-chat-knowledge-upgrade/14-CONTEXT.md` — D-13 cache
  observability deferred to Phase 15 (Phase 15 re-defers to v1.3+; see D-13
  above), 14-07 gap-closure shipped the `chat.truncated` seam wired here
  in D-14
- `.planning/phases/12-tech-debt-sweep/12-CONTEXT.md` — D-26 Chat Regression
  Gate 9-item pattern (applied client-only in Phase 15 per D-15)
- `.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md` — D-04
  active-project set (6 MDX files in `src/content/projects/`); the scroll-
  depth observer mounts on the 6 matching `/projects/[id]` routes

### Design contract

- `design-system/MASTER.md` §8 Anti-Patterns — no subtractive amendments;
  Phase 15 adds no visual surface so §5/§6 unchanged. §10 Chat Bubble
  Exception unchanged (chat UI not touched)

### Existing implementation sites

- `src/layouts/BaseLayout.astro` — Umami `<script>` insert target (after
  `<SEO />`, before `<Font>`); the D-26 gate surface for ANAL-01
- `src/scripts/chat.ts:373-388` — existing `trackChatEvent(action, label?)`
  function; chat:analytics CustomEvent dispatcher (Phase 7 D-36); call sites
  at lines 520 (`chat_open`), 700 (`chip_click`), 734 (`chat_error: offline`),
  742 (`message_sent`), 845 (`chat_error: <type>`). D-14 adds a 6th call site
  for `chat_truncated` alongside SSE-frame parsing
- `src/pages/api/chat.ts:119-134` — shipped `chat.truncated` seam:
  `console.warn` + `{truncated: true}` SSE frame + Phase-15-attribution
  comment. **Server stays byte-identical in Phase 15 per D-15**
- `src/pages/projects/[id].astro` — sentinel `<div>` insertion target for
  scroll-depth (D-06); the page already renders `<article>` via MDX; scope
  decision D-05
- `src/data/contact.ts` — `CONTACT.email`, `CONTACT.github`, `CONTACT.linkedin`
  define the hostnames the outbound classifier needs to recognize (github.com,
  linkedin.com, mailto:)
- `src/components/ContactSection.astro`, `src/components/primitives/Footer.astro`,
  `src/components/primitives/MobileMenu.astro`, `src/pages/projects/[id].astro`
  — mailto: / http / demo / github link surfaces the delegated listener
  covers. No component edits needed (delegation at document level per D-10)

### Pattern references (analogs to mirror)

- `src/scripts/chat.ts` — canonical pattern for plain-TS client scripts
  (IIFE, TypeScript strict, typed `CustomEvent`s, DOMPurify-safe DOM writes);
  `analytics.ts` mirrors its shape
- `scripts/sync-projects.mjs` / `scripts/pages-compat.mjs` — reference for
  plain-node build-chain scripts (none are needed in Phase 15; Umami is
  runtime-only)

### New deliverables (files to author)

- `src/scripts/analytics.ts` (new) — chat:analytics forwarder + delegated
  outbound listener + `resume_download` dedup
- Scroll-depth implementation (in `src/scripts/analytics.ts` or a new
  `src/scripts/scroll-depth.ts` — Claude's Discretion)
- `tests/client/analytics.test.ts` (new) — forwarder, classification, dedup,
  observer one-shot tests; mock `window.umami.track`
- `.planning/phases/15-analytics-instrumentation/15-VERIFICATION.md` —
  D-26 client-surface regression checklist (per D-15) + Umami dashboard
  event-presence screenshots + CF Web Analytics toggle confirmation
- `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md`
  — backlog todo capturing D-13 deferred scope (created at phase execution
  per D-16)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/scripts/chat.ts` `trackChatEvent(action, label?)` +
  `chat:analytics` CustomEvent dispatcher** (lines 373-388) — already emits
  content-free `{action, label, timestamp}` payload; `analytics.ts` attaches
  one `document.addEventListener("chat:analytics", ...)` and fans out to
  Umami via `window.umami?.track(action, {label})`. Zero changes to chat.ts
  for D-11. D-14 adds a 6th call site inside chat.ts' SSE loop for
  `chat_truncated`.
- **`src/data/contact.ts`** — `CONTACT.email`, `CONTACT.github`, `CONTACT.linkedin`
  hostnames; outbound classifier uses these verbatim so the social-link set
  stays single-sourced.
- **`src/pages/api/chat.ts:119-134`** — the server already ships the
  `chat.truncated` console.warn + SSE `{truncated: true}` frame. Phase 15
  consumes; server stays byte-identical.
- **Existing DOMPurify / markdown pipeline in chat.ts** — not touched by
  Phase 15, but mentioned here because the D-26 client-surface regression
  gate (D-15) re-runs markdown.test.ts + chat-copy-button.test.ts against
  the new chat.ts SSE-parser diff.

### Established Patterns

- **Plain-TS scripts in `src/scripts/`** — `chat.ts` is the one existing
  example. TypeScript strict, no framework coupling, IIFE-wrapped. New
  `analytics.ts` mirrors.
- **Client-script imports in BaseLayout** — `chat.ts` is imported by
  `ChatWidget.astro` (via Astro's `<script>`); new `analytics.ts` should
  be imported by `BaseLayout.astro` via an Astro `<script>` block (loads
  once, idempotent across page navigations which don't happen since there's
  no ClientRouter).
- **Zero runtime deps (v1.2 cross-phase gate)** — Umami is a `<script src>`
  reference, not an npm install. CF Web Analytics is dashboard-toggle. No
  `package.json` delta unless the planner adopts a testing helper (e.g.,
  `@testing-library/user-event` — already installed? check pre-plan).
- **Snake_case event names** — established by chat.ts (`chat_open`,
  `message_sent`, `chip_click`, `chat_error`). All new event names
  (`resume_download`, `outbound_click`, `scroll_depth`, `chat_truncated`)
  follow the same convention.
- **CustomEvent payload discipline** — `chat:analytics` carries no user
  input text (Phase 7 D-36). Chip-click label is curated chip text
  (developer-written prompts shown in the UI) — still safe to forward.
  `outbound_click` metadata is stripped to hostname+path only (D-12) —
  same discipline.

### Integration Points

- **`BaseLayout.astro` `<head>`** — Umami `<script>` lands here, after
  `<SEO />` and before `<Font>` preloads. D-26 surface.
- **`BaseLayout.astro` `<body>` Astro `<script>` block** — `analytics.ts`
  imports here so the delegated click listener mounts once per full
  page-load. No ClientRouter, so it survives all navigations.
- **`src/pages/projects/[id].astro` `<article>` body** — sentinel `<div>`s
  inject here (inside the MDX-rendered layout, absolute-positioned at %
  offsets via CSS). The scroll-depth observer initializes from
  `analytics.ts` / scroll-depth script on DOMContentLoaded for this route
  only (route detection via `location.pathname.startsWith("/projects/")`
  and a path-depth check).
- **`src/scripts/chat.ts`** — SSE response loop gains a `parsed.truncated`
  branch that calls `trackChatEvent("chat_truncated")`. Single call-site
  insertion, additive, no deletion.
- **Cloudflare Pages project settings** — ANAL-02 is a dashboard toggle, not
  a code change. Planner tasks: enable Web Analytics, capture screenshot
  for `15-VERIFICATION.md`. No wrangler.jsonc edits.
- **Umami Cloud dashboard** — Jack's pre-deploy task: create Umami website
  entry for `jackcutrara.com`, copy the `data-website-id` UUID into
  `BaseLayout.astro` per D-03. Planner documents as phase-opening checklist.

### Creative Options

- **Shared scroll-depth + Phase 16 scroll-reveal observer** — both need
  `IntersectionObserver` on `/projects/[id]`; Phase 16's `src/scripts/
  motion.ts` (MOTN-02) is structurally similar. If the planner can see a
  clean factoring, both phases' observers could share a base — but Phase
  16 is the file's primary owner per the ROADMAP, so Phase 15 should NOT
  pre-emptively author `motion.ts`. `scroll-depth.ts` as a standalone
  Phase 15 file is the safe choice; Phase 16 may consolidate later.
- **Umami event-metadata size** — Umami dashboards truncate long metadata
  values. Hostname+path is typically <60 chars; chat `label` values (chip
  text) are curated and typically <30 chars. Well under limits.
- **The delegated outbound listener** is a natural home for future
  `.mdx`-sourced internal-link tracking if we ever want to measure "which
  project links get clicked from the work list" — not in scope for Phase
  15, but the listener's shape supports it without refactor.

</code_context>

<specifics>
## Specific Ideas

- **Analytics is a credibility signal, not vanity.** The site measures
  recruiter engagement the same way a serious engineer instruments any
  product — observability as a first-class concern, implemented
  correctly (cookie-free, content-free, production-gated). A site that
  says "I care about user privacy" in copy but ships a cookie banner is
  less credible than one that just doesn't need the banner. Umami +
  CF Web Analytics is the "doesn't need the banner" path.
- **The chat:analytics CustomEvent is already load-bearing** — Phase 7
  shipped it content-free on purpose. Phase 15 honors that contract by
  forwarding payload verbatim (no PII enrichment, no user-input
  injection). Future chat additions that need to emit new analytics
  events dispatch via `trackChatEvent()` — the pattern is locked.
- **Resume download is the single most important recruiter event.** D-09
  prevents double-counting; this is the dashboard's headline metric, and
  the moment it shows inflated numbers is the moment the dashboard stops
  being trustworthy.
- **Scroll-depth 100% = reached the end of a case study** = the strongest
  "engineer read the deep-dive" signal the site can produce. Pairing it
  with `message_sent` (chat engagement) and `resume_download` in the same
  session is the ideal recruiter funnel.
- **Preview deploys stay silent by design** (D-01 belt-and-suspenders).
  Phase 14 already had one CORS preview-subdomain adjustment (commit
  `e17d0f8`); keeping preview deploys analytics-silent avoids needing a
  parallel "is this prod or preview" toggle in Umami.
- **Truncation wire-up is low-risk cleanup** that completes Phase 14
  gap-closure 14-07's intent. The server already writes the line; the
  client already ignores the frame. Phase 15 closes the loop with ~5 LOC
  of additive client code.
- **Cache-hit-rate deferral is the right call for portfolio traffic.**
  At ~dozens of chats per week (if that), cache-hit-rate is not a
  performance signal — it's a cost signal, and the cost is bounded by
  Anthropic rate-limits anyway. Revisit when/if steady-state spend
  exceeds ~$5/mo (matches the existing "Future Requirements" threshold
  in REQUIREMENTS.md).

</specifics>

<deferred>
## Deferred Ideas

- **Cache-hit-rate observability** (`cache_read_input_tokens` /
  `cache_creation_input_tokens` per request → Umami `chat_cache` event).
  Phase 14 D-13 deferred; Phase 15 D-13 re-defers to v1.3+. Would require
  net-new server chat.ts code intercepting the Anthropic SDK's
  `message_start` event, a new SSE diagnostic frame shape, a client parser,
  and D-26 full-surface regression. Out-of-proportion for portfolio-scale
  traffic. Captured as a backlog todo at
  `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md`
  (created during phase execution per D-16).
- **Plausible / Fathom / self-hosted migration.** Umami Cloud free tier is
  assumed sufficient; if traffic scales or a feature gap appears (Plausible's
  richer funnels, Fathom's uptime monitoring), revisit. Not planted as a
  seed — the switching cost is low (one `<script>` tag + env).
- **CF Web Analytics explicit `<script>` in BaseLayout** (as opposed to the
  dashboard auto-inject in D-04). Fallback path if CF's auto-injection ever
  fails on the Pages deployment; planner notes but doesn't ship.
- **Scroll-depth on `/about` narrative.** ANAL-05 names "project-page
  scroll depth"; `/about` is narrative-heavy and a legitimate engagement
  surface, but out of scope for v1.2. Candidate for v1.3 if content
  analytics shows engineers finish About but bounce before projects.
- **Session-replay / heatmap integration** (e.g., PostHog, Microsoft
  Clarity). Cookie-free session recording exists (Clarity) but meaningfully
  larger privacy surface than Umami. Explicitly not on the roadmap.
- **Per-project card-click tracking from `/projects` index.** Delegated
  listener could easily add internal `/projects/<slug>` click tracking;
  would measure "which projects get clicked on" vs "which ones get read."
  Not in ANAL-05 scope. Easy add if desired later.
- **A/B testing on chat-widget chip prompts.** Once Umami shows which
  chips get clicked, one natural next step is rotating chip wording. Not
  v1.2 scope.
- **Phase 16 `motion.ts` observer consolidation.** If Phase 16 wants a
  single `IntersectionObserver` for both scroll-reveal and scroll-depth,
  Phase 16 does the refactor. Phase 15 ships `scroll-depth` as its own
  file to keep the Phase 16 motion surface unconfused.

### Reviewed Todos (not folded)

*No todos matched Phase 15 scope during cross-reference. The only pending
todo — `2026-04-23-configure-chat-rate-limiter-binding.md` — is orthogonal
(a rate-limiter config gap, not observability).*

</deferred>

---

*Phase: 15-analytics-instrumentation*
*Context gathered: 2026-04-23*
