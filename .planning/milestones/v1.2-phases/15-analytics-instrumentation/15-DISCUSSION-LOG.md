# Phase 15: Analytics Instrumentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 15-analytics-instrumentation
**Areas discussed:** Umami + CF Web Analytics placement, Scroll depth strategy, Outbound dedup + event taxonomy, Chat cache-hit-rate wire-up

---

## Umami + CF Web Analytics placement

### Production gating

| Option | Description | Selected |
|--------|-------------|----------|
| Belt-and-suspenders: PROD guard + data-domains | `import.meta.env.PROD` conditional + `data-domains="jackcutrara.com"` attribute. Script not in HTML on dev/preview; Umami also drops mismatched hostnames server-side. | ✓ |
| PROD build guard only | Just the Astro conditional. Simpler but no server-side safety net. | |
| data-domains filter only | Ship script in every build, let Umami filter. Preview deploys still load the script. | |

**User's choice:** Belt-and-suspenders: PROD guard + data-domains (Recommended)
**Notes:** Preview subdomains stay silent by default; no per-env var needed.

### Script placement

| Option | Description | Selected |
|--------|-------------|----------|
| `<head>` after `<SEO />`, async+defer | Both Umami and CF beacon inside `<head>`, after SEO component. Parsing never blocks. | ✓ |
| End of `<body>`, before `</body>` | Legacy pattern; no perf benefit with async+defer. | |
| Astro SSR-rendered wrapper component | Extract to `<Analytics />`. Cleaner if we grow beyond two scripts; premature today. | |

**User's choice:** `<head>` after SEO, async+defer (Recommended)
**Notes:** Lighthouse Performance ≥99 gate must hold.

### data-website-id storage

| Option | Description | Selected |
|--------|-------------|----------|
| Static literal in BaseLayout | Hardcode UUID. IDs are public (in HTML for every visitor). One fewer env var. | ✓ |
| `PUBLIC_UMAMI_ID` env var | Read from `import.meta.env.PUBLIC_UMAMI_ID`. Useful only if we'd rotate IDs (we don't). | |

**User's choice:** Static literal in BaseLayout (Recommended)
**Notes:** Umami website IDs are public; no secret.

### Cloudflare Web Analytics enablement

| Option | Description | Selected |
|--------|-------------|----------|
| Enable in CF dashboard, auto-inject | CF Pages Web Analytics toggle; beacon auto-injected by the proxy for jackcutrara.com. No BaseLayout change. | ✓ |
| Explicit `<script>` in BaseLayout | Same PROD gate as Umami. Belt-and-suspenders; works even if CF auto-inject is disabled. | |
| Skip CF Web Analytics | Rely on CF Pages built-in traffic dashboard. Fails ANAL-02 (no Core Web Vitals). | |

**User's choice:** Enable in CF dashboard, auto-inject (Recommended)
**Notes:** Zero chance beacon ships on preview subdomains.

---

## Scroll depth strategy

### Page scope

| Option | Description | Selected |
|--------|-------------|----------|
| `/projects/[id]` detail pages only | ANAL-05 literal ("project-page scroll depth"). 600–900-word case studies. Smallest, cleanest signal. | ✓ |
| Detail pages + /about + homepage | About narrative is recruiter-scan target. Higher event volume. | |
| All pages with any scroll content | Blanket coverage; marginal signal on /contact etc. | |

**User's choice:** `/projects/[id]` detail pages only (Recommended)

### Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| 4 sentinel divs at 25/50/75/100% of `<article>` | Single IntersectionObserver watches all 4. Textbook pattern. | ✓ |
| Observe existing case-study H2s | Tie depth to structural progress. Couples analytics to MDX structure. | |
| Scroll-math without sentinels | Listen to scroll events + math. No DOM injection, more code, no win over IO. | |

**User's choice:** 4 sentinel divs at 25/50/75/100% of `<article>` (Recommended)
**Notes:** Net-new pattern — no existing IntersectionObserver in src/.

### "Reached" semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Sentinel top enters viewport (threshold 0 or tiny) | Natural "crossed this point" semantics. Tolerant of tall sentinels on short viewports. | ✓ |
| Sentinel centered in viewport (rootMargin trick) | Stricter "actually looked at this spot" signal; more sensitive to layout quirks. | |
| Sentinel fully visible (threshold 1.0) | Zero-height sentinels (1px) hit this easily; ordinary sentinels may never. | |

**User's choice:** Sentinel top enters viewport (threshold 0 or tiny) (Recommended)

### Dedup scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per page-view (observer.unobserve after fire) | Each navigation can fire each of 4 events once. Reloads refire. Matches GA4 semantics. | ✓ |
| Per session via sessionStorage | Reloads won't refire. sessionStorage reads/writes per observer fire. | |
| Always fire (no dedup) | Refire on every intersection entry. Inflates events. | |

**User's choice:** Per page-view (observer.unobserve after fire) (Recommended)

---

## Outbound dedup + event taxonomy

### Resume PDF click

| Option | Description | Selected |
|--------|-------------|----------|
| resume_download only | Delegated listener checks `.pdf` first, emits `resume_download`, returns early. | ✓ |
| resume_download AND outbound_click | Both events fire. Accurate in a sense; painful for dashboards. | |
| outbound_click only | Single bucket. Most important recruiter signal becomes a filter, not a headline. | |

**User's choice:** resume_download only (Recommended)
**Notes:** Exactly one PDF on the site; double-counting inflates the headline metric.

### Outbound event shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single `outbound_click` with `{type, href}` metadata | One event name; metadata discriminates (type ∈ {github, linkedin, email, external, pdf}). | ✓ |
| Per-type event names (outbound_github, etc.) | Top-level Umami events per destination. Easier at-a-glance; harder to extend. | |
| Single outbound_click, href only (no type) | Simpler code; dashboards have to classify later. | |

**User's choice:** Single `outbound_click` event with `{type, href}` metadata (Recommended)

### chat:analytics forwarding scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 4 existing actions (chat_open, message_sent, chip_click, chat_error) | One document listener, one umami.track() per action. Full funnel signal. | ✓ |
| Only chat_open (ANAL-05 literal) | Strict reading. Drops existing instrumentation. | |
| chat_open + message_sent only | Engagement, not errors. Loses chip_click + chat_error. | |

**User's choice:** All 4 existing actions (Recommended)
**Notes:** Chat.ts already dispatches all four. Zero extra instrumentation cost. A 5th action (`chat_truncated`) is added via D-14 in Area 4.

### Href metadata policy

| Option | Description | Selected |
|--------|-------------|----------|
| Hostname + pathname, no query/fragment | e.g., 'github.com/jackc625/seatwatch'. `mailto:` stores 'mailto' (not email). | ✓ |
| Full href verbatim | Includes query+fragment. utm_* / PII risk with future links. | |
| Hostname only | Just 'github.com' — lose per-repo granularity. | |

**User's choice:** Hostname + pathname, no query/fragment (Recommended)
**Notes:** Preserves Phase 7 D-36 content-free discipline.

---

## Chat cache-hit-rate wire-up

### Cache-hit-rate scope

| Option | Description | Selected |
|--------|-------------|----------|
| Defer entirely to v1.3+ | Phase 14 D-13 already deferred. STATE.md seams were overstated — `chat-cache.ts` + `content-snapshot.ts` don't exist. Portfolio traffic doesn't justify the wiring cost. | ✓ |
| Wire minimally — chat:cache CustomEvent | Intercept message_start → read cache usage → new SSE frame → CustomEvent → Umami. ~30 LOC; full D-26 regression required. | |
| Server-side CF Workers logs only | console.log('chat.cache', ...) — visible in Workers log tail, not Umami. Cheap; misses the spirit of "observable in dashboard." | |

**User's choice:** Defer entirely to v1.3+ (Recommended)

### Truncation event wire-up

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — parse SSE frame, dispatch chat:analytics with chat_truncated | Server already sends `{truncated: true}`. Client-side tiny additive parser → CustomEvent → Umami via D-11 forwarder. Completes Phase 14 gap-closure 14-07 intent. | ✓ |
| Just turn console.warn into a CF Workers log alert | Leave client alone. Server log is there; Umami doesn't see truncation. | |
| Defer to v1.3 too | Surgical ANAL-01..06 only. Clean scope; leaves follow-up. | |

**User's choice:** Yes — parse SSE frame, dispatch chat:analytics with chat_truncated (Recommended)

### chat.ts change budget

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal additive — client parses truncated SSE, no server change | Server chat.ts byte-identical. D-26 runs on client surface only. | ✓ |
| Full wire-up — server + client + cache observability | More scope, more signal. Full D-26 regression on both sides. | |
| Zero change — chat.ts byte-identical on both sides | analytics.ts listens to existing events only. No truncation forwarding. Most conservative. | |

**User's choice:** Minimal additive — client parses truncated SSE, no server change (Recommended)
**Notes:** Lowest-risk D-26 surface possible — server invariants (CORS, rate limit, validation, streaming shape) untouched.

### Deferred capture mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Log to 15-CONTEXT.md Deferred Ideas + backlog todo | CONTEXT.md carries the idea; a todo file in .planning/todos/pending/ keeps it active during v1.3 planning. | ✓ |
| Deferred section only, no todo file | Lighter. One mention in CONTEXT.md. Easier to forget. | |
| Plant-seed for v1.3 milestone trigger | /gsd-plant-seed auto-surfaces at v1.3. Heavier mechanism. | |

**User's choice:** Log to 15-CONTEXT.md Deferred Ideas + backlog todo (Recommended)

---

## Claude's Discretion

- Exact filename/layout for `analytics.ts` vs splitting scroll-depth into its own file
- Exact sentinel markup shape (div vs span)
- Outbound-link classification heuristic (allow-list vs pattern-based)
- Delegated listener mount point (document.body vs layout root)
- Dashboard setup mechanics (creating Umami site entry, capturing data-website-id)
- Event-name casing for `chat_truncated` (snake_case follows existing chat.ts convention)
- Whether `analytics.ts` exports a typed `track()` wrapper vs calling `window.umami?.track` directly
- Fallback to explicit CF Web Analytics `<script>` tag if auto-injection proves insufficient

## Deferred Ideas (noted for future phases / v1.3+)

- Cache-hit-rate observability (Phase 14 D-13 + Phase 15 D-13)
- Plausible / Fathom / self-hosted migration
- CF Web Analytics explicit `<script>` fallback
- Scroll-depth on `/about` narrative
- Session-replay / heatmap (PostHog, Clarity)
- Per-project card-click tracking from `/projects` index
- A/B testing on chat-widget chip prompts
- Phase 16 `motion.ts` observer consolidation
