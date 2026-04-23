# Phase 15: Analytics Instrumentation - Research

**Researched:** 2026-04-23
**Domain:** Cookie-free product analytics (Umami Cloud) + Cloudflare Web Analytics on an Astro 6 / Cloudflare Pages static-first site with a single per-route SSR chat API. Zero new runtime dependencies.
**Confidence:** HIGH on library shape + Astro `<script>` semantics + IntersectionObserver pattern + D-26 client-only surface. MEDIUM on Cloudflare Web Analytics auto-inject behavior for Pages custom-domain projects (documented at the general level; the exact "one-click toggle works identically on Pages custom domains" claim needs a production dashboard confirmation during execution — this is why D-04 already carries an explicit fallback path).

---

<user_constraints>
## User Constraints (from 15-CONTEXT.md)

### Locked Decisions (D-01 … D-15)

- **D-01 Belt-and-suspenders prod gating:** `import.meta.env.PROD && <script … data-domains="jackcutrara.com" />`. The Umami tag is literally absent from HTML on dev/preview builds. Even if it ever leaked into a non-prod build, Umami's server-side `data-domains` filter drops events from mismatched hostnames. Preview subdomains (`*.portfolio-5wl.pages.dev`) stay silent by default.
- **D-02 Script placement:** `<head>` after `<SEO />` and before `<Font>` preloads. `async` + `defer` attributes both set so parsing never blocks. Lighthouse Performance gate (≥99) holds.
- **D-03 `data-website-id` = committed static literal:** Umami website IDs are public (visible in HTML to every visitor). No secret, no env var, one-line commit.
- **D-04 CF Web Analytics = dashboard toggle, NO BaseLayout script:** Cloudflare Pages toggles Web Analytics per-project; the beacon (`static.cloudflareinsights.com/beacon.min.js`) is auto-injected by the proxy for `jackcutrara.com`. Zero BaseLayout change for ANAL-02. Task: enable the toggle + capture dashboard screenshot in `15-VERIFICATION.md`.
- **D-05 Scroll-depth scope = `/projects/[id]` only** (ANAL-05 literal "project-page scroll depth"). Detail pages carry the 600–900-word case studies — the only surface where "scrolled past 75%" has signal.
- **D-06 4 sentinel `<div>`s at 25/50/75/100% of `<article>`**, single `IntersectionObserver` watching all four.
- **D-07 Fire when sentinel top enters viewport** (threshold 0).
- **D-08 Per-page-view dedup via `observer.unobserve(entry.target)` on fire.** Reloads refire (matches GA4 scroll-depth semantics).
- **D-09 `/jack-cutrara-resume.pdf` fires `resume_download` only** (early return before outbound_click path).
- **D-10 Single `outbound_click` event with `{type, href}` metadata**; `type` ∈ `{github, linkedin, email, external, pdf}`.
- **D-11 `analytics.ts` forwards all 4 existing `chat:analytics` actions** (`chat_open`, `message_sent`, `chip_click`, `chat_error`) + D-14 adds the 5th (`chat_truncated`).
- **D-12 Href metadata = hostname + pathname only** (strip query/fragment); `mailto:` stored as literal `"mailto"`.
- **D-13 Cache-hit-rate observability DEFERRED to v1.3+.**
- **D-14 Wire existing `chat.truncated` seam to Umami** via SSE frame parser in `src/scripts/chat.ts` (client, additive).
- **D-15 `chat.ts` change = client-only additive; `src/pages/api/chat.ts` server stays BYTE-IDENTICAL.**

### Claude's Discretion

- Exact filename and layout for the new analytics module (`src/scripts/analytics.ts` natural; scroll-depth may factor into own file)
- Exact sentinel markup (empty `<div>` vs `<span aria-hidden>` vs data-attribute)
- Outbound classifier heuristic (static allow-list vs pattern-based)
- Whether delegated listener mounts on `document` or on a layout-specific root
- Pre-deploy operational checklist (create Umami site entry, capture UUID, toggle CF Web Analytics) — Jack drives, planner documents in `15-VERIFICATION.md`
- Exact event-name casing — recommendation is snake_case per D-11 precedent
- Whether `analytics.ts` exports a typed `track()` wrapper or calls `window.umami?.track` directly
- CF Web Analytics fallback path if auto-inject fails

### Deferred Ideas (OUT OF SCOPE)

- Cache-hit-rate observability (`cache_read_input_tokens` / `cache_creation_input_tokens`) — v1.3+
- Plausible / Fathom / self-hosted Umami migration
- CF Web Analytics explicit `<script>` in BaseLayout (fallback only)
- Scroll-depth on `/about` narrative
- Session-replay / heatmap integration (PostHog, Clarity)
- Per-project card-click tracking from `/projects` index
- A/B testing on chat-widget chip prompts
- Phase 16 `motion.ts` observer consolidation

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANAL-01 | Umami Cloud (free tier) integrated via `<script>` in BaseLayout, env-gated to production hostname only | §1 Umami script shape + §3 Astro `<script>` semantics — confirmed exact tag format, `is:inline` is required for external `src`, frontmatter-conditional rendering works at build time |
| ANAL-02 | Cloudflare Web Analytics enabled as secondary for Core Web Vitals | §4 CF Web Analytics — dashboard toggle confirmed for Pages projects; auto-inject happens at proxy layer; custom-domain caveat documented |
| ANAL-03 | `src/scripts/analytics.ts` forwards existing `chat:analytics` CustomEvent (content-free per Phase 7 D-36) to Umami | §1 `umami.track(event, data)` signature + §5 SSE frame parser for `chat_truncated`; forwarder is a single `document.addEventListener("chat:analytics", …)` |
| ANAL-04 | Delegated outbound-link tracking — `a[href^="http"]`, `mailto:`, `.pdf` emit Umami events | §6 outbound classifier edge cases — `closest("a")` pattern + URL parsing + `.pdf` early-return for resume dedup |
| ANAL-05 | Recruiter-engagement events instrumented: resume download, chat widget open, outbound social link clicks, project-page scroll depth | §2 IntersectionObserver sentinel pattern + §6 outbound classifier + §1 Umami — all four seams validated |
| ANAL-06 | No cookie consent banner required (Umami + CF Web Analytics are cookie-free by design) | §1 Umami tracker docs + §4 Cloudflare Web Analytics FAQ — both products explicitly cookie-free in 2026 |

</phase_requirements>

## Summary

Phase 15 is a low-risk additive phase — no new runtime dependencies, one new file (`src/scripts/analytics.ts`), one minor additive diff in `src/scripts/chat.ts` (client-only SSE frame parser for `chat.truncated`), a single `<script is:inline>` insert into `BaseLayout.astro` head, and 4 sentinel `<div>`s + a loader in `src/pages/projects/[id].astro`. The server (`src/pages/api/chat.ts`) stays byte-identical per D-15. Zero server changes means the D-26 Chat Regression Gate reduces to its client-surface subset: markdown render, clipboard parity, focus trap, localStorage persistence, and SSE parse — none of which are actually modified by the truncation-frame parser, only augmented.

All 15 CONTEXT.md decisions are **implementable as stated** against current (April 2026) Umami Cloud and Cloudflare Web Analytics behavior. Two validation notes the planner must honor:

1. **D-04 auto-inject assumption** (CF Web Analytics on Pages custom domains): documented as the happy path, but Cloudflare community threads show occasional regressions where the beacon either fails to inject or injects despite being disabled. Treat the dashboard screenshot requirement as mandatory — confirm actual network traffic to `static.cloudflareinsights.com` during verification, not just that the toggle is on. A fallback plan to insert an explicit `<script>` tag is already noted in CONTEXT.md Claude's Discretion.
2. **D-01 Astro frontmatter-conditional script** (`{import.meta.env.PROD && <script …/>}`): Vite statically replaces `import.meta.env.PROD` at build time, so the JSX branch evaluates to `false` in dev and is not rendered. This works as intended and has been repeatedly confirmed in the Astro documentation. The script MUST use `is:inline` — without it, Astro will try to bundle the external `src` URL and strip/mangle `data-*` attributes.

**Primary recommendation:** Adopt the exact Umami snippet shape documented below (§1) verbatim; mount the delegated outbound listener on `document` (not layout root) for click-event bubble capture from any page; author scroll-depth as part of `src/scripts/analytics.ts` (no separate file) since it's a thin 20-line block that shares the same `window.umami?.track` call-site — Phase 16 can split later if `motion.ts` consolidation emerges.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Umami tag injection | Frontend Server (Astro SSG) | — | Astro renders `BaseLayout.astro` to static HTML at build; the `import.meta.env.PROD` guard is a build-time decision, not runtime |
| Umami event emission (`chat_open` etc.) | Browser / Client | — | `window.umami.track()` is a browser global; `analytics.ts` runs client-side on page load |
| CF Web Analytics beacon injection | CDN / Edge | — | Cloudflare proxy mutates the HTML response in-flight on production traffic only; zero code surface |
| Outbound click delegation | Browser / Client | — | Delegated `click` listener on `document` captures bubbling events — no per-component wiring |
| IntersectionObserver scroll-depth | Browser / Client | Frontend Server (SSG) | Sentinel `<div>` markup ships in static HTML from `[id].astro`; observer constructed client-side on project-detail routes only |
| `chat.truncated` event wiring | Browser / Client | API / Backend (unchanged) | SSE frame is emitted server-side (already shipped Phase 14-07) but parsed client-side; D-15 locks server surface as byte-identical |
| `resume_download` dedup | Browser / Client | — | Early-return path inside the delegated click listener — purely classification logic |

---

## 1. Umami Cloud — Script Shape, Global, `track()` Signature, Limits

**Confidence:** HIGH

### 1.1 Exact script tag format (April 2026)

```html
<script
  defer
  src="https://cloud.umami.is/script.js"
  data-website-id="REPLACE_WITH_UUID"
  data-domains="jackcutrara.com"
></script>
```

- **Src URL:** `https://cloud.umami.is/script.js` (confirmed live — file is minified JS that sets `window.umami` with `{track, identify, getSession}` methods) [VERIFIED: WebFetch https://cloud.umami.is/script.js 2026-04-23]
- **`defer` attribute:** present — deferred execution (runs after document parsed, before `DOMContentLoaded`). Umami's official example uses `defer`. [CITED: docs.umami.is/docs/tracker-configuration]
- **Size:** ~2 KB transferred. Zero impact on Lighthouse Performance budget. [CITED: umami docs]

### 1.2 Supported attributes (relevant to Phase 15)

| Attribute | Required | Purpose | D-01/D-02 fit |
|-----------|----------|---------|---------------|
| `data-website-id` | YES | Public UUID identifier for the Umami website entry | D-03 static literal |
| `data-domains` | NO (but recommended) | Comma-delimited hostname allow-list; events from other hostnames are dropped server-side. **Strict match** against `window.location.hostname` | D-01 belt-and-suspenders |
| `data-host-url` | NO | Override data endpoint. Not needed for Umami Cloud (default is correct) | — |
| `data-auto-track` | NO | Toggle automatic pageview tracking (default: enabled). Leave default | — |
| `data-tag` | NO | Group events for A/B testing filtering | — |
| `data-performance` | NO | Enable Core Web Vitals collection. **Leave OFF** — CF Web Analytics already covers this (D-04) | — |
| `data-do-not-track` | NO | Respect browser DNT. Default off | — |

[CITED: https://docs.umami.is/docs/tracker-configuration — confirmed full attribute list]

### 1.3 `data-domains` subdomain behavior

**CRITICAL gotcha:** `data-domains` performs **strict hostname equality** against `window.location.hostname`. It does NOT normalize `www.` or trailing-dot variants.

> "comma delimited list of domain names. Each value matches against `window.location.hostname`... you should double check if your website uses `www` or not." [CITED: docs.umami.is/docs/tracker-configuration]

**Implication for jackcutrara.com:**
- `data-domains="jackcutrara.com"` matches the apex **only**.
- If `www.jackcutrara.com` is ever live (e.g., a future 301 from www→apex misfires and a visitor lands on www directly), events would be dropped.
- Current DNS for jackcutrara.com (confirmed via CF Pages config): apex-only custom domain. No `www` variant configured. `data-domains="jackcutrara.com"` is correct.
- **Planner note:** If Jack ever adds a `www` CNAME or a secondary domain, update this attribute to `data-domains="jackcutrara.com,www.jackcutrara.com"`.

### 1.4 `window.umami` global — when is it defined?

- The Umami script is fetched with `defer`, so it executes after parsing and before `DOMContentLoaded`. [Standard HTML spec]
- On script execution, `window.umami` is set with methods `{track, identify, getSession}`. [VERIFIED: direct fetch of script.js]
- **Timing hazard:** if any `umami.track(...)` call is invoked BEFORE the script loads (e.g., a click that fires inline during initial document parse), `window.umami` will be `undefined` and the call throws.
- **Mitigation pattern (standard across Umami docs + community):** always call via optional chaining: `window.umami?.track("event_name", {key: "value"})` [CITED: docs.umami.is/docs/track-events — example uses `window.umami.track(...)` directly but community threads uniformly recommend `?.` for safety]
- **For Phase 15:** every call site in `analytics.ts` should use `window.umami?.track(...)`. Lost early events are acceptable (the fallback is silent, not thrown) — bubble events like chat-open and link-click cannot fire until the user interacts, by which time the `defer`-loaded script has executed.

[ASSUMED] The 15-30ms window between DOM parse completion and Umami script execution is not measurable for an interactive recruiter — first interaction is >200ms from page load in practice.

### 1.5 `umami.track()` signatures

Four overloads, per official docs [CITED: https://docs.umami.is/docs/tracker-functions]:

```ts
umami.track();                               // current page — auto-pageview
umami.track(payload: object);                // custom payload, replaces pageview shape
umami.track(event_name: string);             // custom event, no data
umami.track(event_name: string, data: object); // custom event with metadata — THIS IS WHAT WE USE
```

**For Phase 15, every call uses the 2-arg form:** `umami.track(action, metadata)`.

### 1.6 Metadata value-type limits

[CITED: https://docs.umami.is/docs/event-data]

| Type | Limit |
|------|-------|
| Strings | Max length 500 chars |
| Numbers | Max precision 4 decimal places |
| Booleans | No specific limit |
| Arrays | Converted to string, max 500 chars |
| Objects | Max 50 properties per object |

**All Phase 15 events are well under limits:**
- `chat:analytics` labels: curated chip text ~<30 chars; error types (`offline`, `rate_limited`) are fixed enums
- `outbound_click` href: hostname + path ~<80 chars (D-12 strips query/fragment)
- `scroll_depth` payload: `{percent: 25, slug: "seatwatch"}` — both well under limits
- `resume_download` payload: `{source: "/projects/seatwatch"}` — short path string

### 1.7 SRI hash

No SRI hash is documented or recommended by Umami. Script URL is immutable (versioned internally). SRI would prevent Umami from deploying fixes without coordinated hash updates across consumers. **Do not add an `integrity` attribute.**

---

## 2. IntersectionObserver Sentinel Pattern

**Confidence:** HIGH

### 2.1 Sentinel markup (D-06)

Required structure in `src/pages/projects/[id].astro`:

```astro
<article class="project-article">
  <!-- existing header + body + next-project sections -->
  <!-- insert 4 sentinels, absolutely positioned inside the relative parent -->
  <div class="scroll-sentinel" data-percent="25" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="50" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="75" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="100" aria-hidden="true"></div>
</article>

<style>
  /* D-06: article must be position:relative so sentinels position as percent of article height */
  .project-article {
    position: relative;
  }
  .scroll-sentinel {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    pointer-events: none;
    /* Top set via data-percent + inline style OR per-class */
  }
  .scroll-sentinel[data-percent="25"]  { top: 25%; }
  .scroll-sentinel[data-percent="50"]  { top: 50%; }
  .scroll-sentinel[data-percent="75"]  { top: 75%; }
  .scroll-sentinel[data-percent="100"] { top: 100%; }
</style>
```

- **Why `position: absolute` inside `position: relative`:** D-06 explicitly calls out "sentinels are positioned by CSS percent not JS math; survives reflow." When the article height changes (mobile reflow, font load, image load), the percentages recompute automatically.
- **Why 1px height:** fire when sentinel top enters viewport (D-07) — a 1px sentinel with `threshold: 0` fires the moment any part of it is visible, which is equivalent to "top edge crossed viewport."
- **Why `aria-hidden="true"` + no text:** screen readers skip; assistive technology sees 0 content. No impact on accessibility tree.
- **`pointer-events: none`:** prevents any accidental click or hover interference with underlying text. [Defensive — sentinels shouldn't ever intercept but this eliminates the class of bugs entirely.]
- **Sentinel at 100%:** a sliver at `top: 100%` will be just below the article's content box. Entering the viewport means the reader has scrolled past the article end — which is the intended "read-to-end" signal.

**Note on `position: absolute` inside `<article>` that already has complex child layouts:** The `<article>` element in `[id].astro` wraps `<section>` elements with `.section` styles. Adding `position: relative` to `<article>` creates a new positioning context but does **not** affect child layout because the sections are not absolutely positioned. [VERIFIED: read [id].astro lines 32-81]

### 2.2 Observer configuration (D-07, D-08)

```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const percent = entry.target.getAttribute("data-percent");
      if (!percent) continue;
      window.umami?.track("scroll_depth", {
        percent: Number(percent),
        slug: window.location.pathname.split("/").pop() ?? "unknown",
      });
      observer.unobserve(entry.target); // D-08: one-shot per page-view
    }
  },
  { threshold: 0, rootMargin: "0px" }
);

document.querySelectorAll(".scroll-sentinel").forEach((el) => observer.observe(el));
```

- **`threshold: 0`:** fires when any pixel of the sentinel enters the viewport. Combined with 1px tall sentinels this is equivalent to "sentinel top crossed viewport top edge going up (or bottom edge going down)."
- **`rootMargin: "0px"`:** default. No adjustment for mobile URL bar collapse — the mobile URL bar effectively shrinks the visual viewport but NOT the layout viewport that IntersectionObserver observes against. No bug risk.
- **Virtual keyboard (mobile soft keyboard rising during chat input):** irrelevant on project detail pages (no textarea). Even if the reader opens the chat widget mid-article, the keyboard does not affect article-height-relative sentinel positions.
- **SPA-like route change cleanup:** Confirmed no `<ClientRouter />` in `BaseLayout.astro` [VERIFIED: Read BaseLayout.astro — no ClientRouter import]. Astro 6 does full-page navigations, so on leaving `/projects/seatwatch` the entire JS runtime is torn down, observers GC'd. No leak.

### 2.3 Duplicate-observer prevention

Astro may fire `astro:page-load` on each navigation even without ClientRouter (for compatibility). Currently `chat.ts` guards with `chatInitialized` at module level and a `panel.dataset.chatBound = "true"` DOM check. [VERIFIED: chat.ts:128, 466] Mirror this pattern:

```ts
let scrollObserverInitialized = false;
function initScrollDepth() {
  if (scrollObserverInitialized) return;
  const sentinels = document.querySelectorAll(".scroll-sentinel");
  if (sentinels.length === 0) return; // Not on a /projects/[id] route
  scrollObserverInitialized = true;
  // ... construct observer
}

document.addEventListener("astro:page-load", initScrollDepth);
if (document.readyState !== "loading") initScrollDepth();
else document.addEventListener("DOMContentLoaded", initScrollDepth);
```

### 2.4 Route detection

Per CONTEXT.md: "route detection via `location.pathname.startsWith(\"/projects/\")` and a path-depth check." Alternatively — and simpler — is the approach above: check for the presence of `.scroll-sentinel` elements. If they exist in the DOM, we're on a project-detail page; if not, the function early-returns. The sentinels are only rendered by `[id].astro`, making their presence a perfect route indicator. **Recommend this pattern over path-string sniffing** — it's one less place to drift if routes ever get renamed.

---

## 3. Astro 6 `<script>` Tag Semantics

**Confidence:** HIGH

[CITED: https://docs.astro.build/en/guides/client-side-scripts/]

### 3.1 Three flavors of `<script>` in .astro files

| Flavor | Behavior |
|--------|----------|
| `<script>{code}</script>` (default) | Processed by Astro: TypeScript support, import bundling, hoisted as `type="module"`, deduplicated, auto-inlined if small. Ignores `async`/`defer` — they're meaningless on inline modules. |
| `<script is:inline>{code}</script>` | Rendered EXACTLY AS WRITTEN. No TS, no import resolution, no hoisting. **All `data-*` attributes preserved verbatim.** |
| `<script src="...">` (external, default) | Astro tries to bundle as a local import — breaks for external URLs. |
| `<script is:inline src="...">` | External script loaded as-is. `defer`/`async` work. Data attributes preserved. **This is what the Umami tag needs.** |

### 3.2 The Umami tag in BaseLayout.astro (ANAL-01 / D-01, D-02, D-03)

```astro
---
// ... existing frontmatter
const WEBSITE_ID = "REPLACE_WITH_UMAMI_UUID"; // D-03: public static literal
---

<html lang="en">
  <head>
    <!-- existing meta/SEO/Font tags -->
    <SEO … />
    {import.meta.env.PROD && (
      <script
        is:inline
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id={WEBSITE_ID}
        data-domains="jackcutrara.com"
      />
    )}
    <Font cssVariable="--font-display-src" />
    <!-- ... -->
  </head>
</html>
```

**Key invariants:**
- `is:inline` is MANDATORY — without it, Astro would attempt to bundle `https://cloud.umami.is/script.js` as a local module and fail; even if it succeeded, data attributes would be stripped or mangled during bundling.
- `{import.meta.env.PROD && …}` evaluates at build time. Vite statically replaces `import.meta.env.PROD` with `true` (`astro build`) or `false` (`astro dev`). [CITED: Astro docs — environment variables]. The `false` branch evaluates to `false && <script/>` → just `false` → Astro's template renderer omits the node entirely. **The Umami tag is literally absent from HTML on dev/preview builds.** Confirmed via GitHub issue #9515 (resolved) — `import.meta.env.PROD` correctly resolves during `astro build` for Cloudflare adapter.
- Precedent in this codebase: `src/components/JsonLd.astro` already uses `<script is:inline type="application/ld+json" set:html={serialized} />` [VERIFIED: Read JsonLd.astro]. Pattern is established.

### 3.3 `async` + `defer` interaction

[CITED: HTML Living Standard / javascript.info / MDN]

If both attributes are set on an external-src script, **`async` wins** (defer is ignored). The script downloads in parallel to parsing and executes as soon as available.

**Implication for D-02:** the CONTEXT.md requirement of "async+defer so parsing never blocks" is imprecise — specifying both gives `async` semantics (execute immediately on download). The Umami snippet as documented officially uses `defer` only. **Recommendation:** use `defer` only (per Umami's own docs). `defer` is strictly better for an analytics tag because:
1. It never blocks parsing (same as `async`)
2. It preserves DOM-ready ordering (so `umami.track()` calls inside `DOMContentLoaded` listeners see `window.umami` defined reliably)
3. It's what the Umami reference snippet specifies

The planner should resolve D-02 as "use `defer` only, drop `async`" — this is within spirit of the CONTEXT.md decision (non-blocking) and correct per the HTML spec.

### 3.4 `data-*` attribute preservation

Confirmed preserved verbatim with `is:inline`. Without `is:inline`, the ESM bundler may rewrite the script into a bundled module and the `data-*` attributes become orphaned from the `src`-pointed bundle. For an external analytics tag this is a correctness bug.

---

## 4. Cloudflare Web Analytics on Cloudflare Pages

**Confidence:** MEDIUM (community reports of regressions, but happy path is documented)

### 4.1 Enabling for a Pages project (D-04 happy path)

[CITED: https://developers.cloudflare.com/pages/how-to/web-analytics/]

1. Dashboard path: `Workers & Pages → {project-name} → Metrics → Web Analytics → Enable`
2. Cloudflare "automatically add[s] the JavaScript snippet to your Pages site on the next deployment"
3. Works on production deploys with custom domains (jackcutrara.com is configured as a custom domain on the Pages project — confirmed in STATE.md ["CF Pages build command confirmed default"])

### 4.2 Beacon injection — HOW it actually works

[CITED: developer community threads + get-started docs]

- The beacon (`static.cloudflareinsights.com/beacon.min.js`) is injected by the **Cloudflare edge proxy** (orange-cloud), NOT by the Pages build step. This means:
  - Production hostname (jackcutrara.com) is proxied — injection happens
  - Preview subdomains (`*.portfolio-5wl.pages.dev`) are ALSO proxied (Cloudflare serves them) — injection MAY happen here too
- **Blockers to auto-injection:**
  - HTML response has `Cache-Control: public, no-transform` → proxy cannot modify payload → beacon NOT injected. [CITED: get-started docs]
  - HTML is malformed (missing DOCTYPE/html/head/body) → injection skipped. [CITED: dashboard how-to]
  - Our Astro-generated HTML is valid and does NOT set `no-transform` → auto-inject should succeed.

### 4.3 Core Web Vitals reporting

Cloudflare Web Analytics collects LCP, FID/INP, CLS, TTFB, and custom performance metrics via the browser Performance API. [CITED: get-started docs — "collects metrics using the Performance API"; community threads confirm CWV dashboard]

### 4.4 Preview-deploy concern (D-04 silent by default)

**Risk:** CF Web Analytics may inject the beacon on preview subdomains too (they're also CF-proxied). The CONTEXT.md D-04 claim "Zero chance the beacon ships on preview subdomains" rests on CF's per-hostname scoping — the beacon is keyed to a specific token associated with `jackcutrara.com` in the CF dashboard, so even if injected elsewhere, events from other hostnames are discarded server-side (similar to Umami's `data-domains`).

**Planner action:** during `15-VERIFICATION.md`, include a preview-subdomain network-tab check — if the beacon fires on a preview URL but no events land in the CF Web Analytics dashboard, that's expected. If beacon injection on preview is visually bothering the Lighthouse audit (unlikely — beacon is tiny), consider the fallback D-04 path (explicit `<script>` in BaseLayout with `import.meta.env.PROD` gate, same as Umami).

### 4.5 Known regressions to watch

- [CITED: https://community.cloudflare.com/t/analytics-script-injected-in-custom-domain-despite-being-disabled/854796] — analytics script injected on a custom domain despite toggle being off (ghost injection). Low priority for our case (we WANT it injected), but documents that CF's injection path is not 100% deterministic.
- [CITED: https://community.cloudflare.com/t/web-analytics-not-injecting-the-js-token/860770] — opposite case, toggle on but no injection. Fix: confirm orange-cloud proxy is active on the custom domain record.

---

## 5. SSE Frame Parser for `chat.truncated` (D-14)

**Confidence:** HIGH

### 5.1 Current SSE parse loop in `src/scripts/chat.ts`

[VERIFIED: Read chat.ts lines 140-210]

```ts
// Lines ~172-200 — the streamChat reader loop
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") {
      onDone();
      return;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.error) {
        onError("api_error");
        return;
      }
      onToken(parsed.text);  // <-- ISSUE: if parsed.truncated === true, this would
                             //            onToken(undefined), rendering "undefined"
    } catch {
      /* skip malformed SSE line */
    }
  }
}
```

### 5.2 Server SSE frame shape (byte-identical per D-15)

[VERIFIED: Read api/chat.ts lines 128-134]

```ts
if (truncated) {
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({ truncated: true })}\n\n`
    )
  );
}
controller.enqueue(encoder.encode("data: [DONE]\n\n"));
```

So the exact literal line is `data: {"truncated":true}\n\n` followed by `data: [DONE]\n\n`.

### 5.3 The additive diff (D-14)

Insert a single guard **between** the `parsed.error` check and the `onToken(parsed.text)` call:

```ts
// Existing code at chat.ts line ~190
try {
  const parsed = JSON.parse(data);
  if (parsed.error) {
    onError("api_error");
    return;
  }
  // NEW (Phase 15 D-14): recognize the server's truncation diagnostic frame.
  // When stop_reason === "max_tokens", the server emits {"truncated": true}
  // BEFORE [DONE]. Forward as a chat:analytics event and continue draining
  // the stream (the [DONE] frame follows on the next iteration and fires onDone).
  if (parsed.truncated === true) {
    trackChatEvent("chat_truncated");
    continue; // skip onToken — this frame has no .text
  }
  onToken(parsed.text);
} catch {
  /* skip malformed SSE line */
}
```

**Design properties:**
- **Additive:** inserts one `if` block. Deletes nothing.
- **Fail-soft:** if the server stops emitting the frame (feature removed upstream), the parser still handles all other frames correctly.
- **No double-fire:** `trackChatEvent("chat_truncated")` dispatches the `chat:analytics` CustomEvent once per response. The `analytics.ts` forwarder (D-11) rides this onto Umami via the 5th action.
- **No double-render:** `continue` skips `onToken(parsed.text)`, which would otherwise render `undefined` into the bot message bubble.
- **Streaming invariant preserved:** the loop continues draining to `[DONE]` or end-of-stream. Does not change `onDone`/`onError` paths.

### 5.4 `trackChatEvent` contract reminder

[VERIFIED: Read chat.ts lines 379-388]

```ts
function trackChatEvent(action: string, label?: string): void {
  document.dispatchEvent(new CustomEvent("chat:analytics", {
    detail: { action, label, timestamp: Date.now() },
  }));
  if (import.meta.env.DEV) console.log(`[chat:analytics] ${action}`, label ?? "");
}
```

- For `chat_truncated`, no `label` is needed — the action alone is the signal.
- If the planner wants to pass `{tokens: 1500}` later, that's a secondary concern and matches the existing `label?` parameter shape.

---

## 6. Outbound Classifier Edge Cases

**Confidence:** HIGH

### 6.1 `mailto:` detection

```ts
if (href.startsWith("mailto:")) {
  window.umami?.track("outbound_click", { type: "email", href: "mailto" });
  return;
}
```

- `mailto:x@y.com?subject=foo&body=bar` — still starts with `mailto:`, no quirks.
- D-12 dictates storing the literal `"mailto"` (not the email address) — this is verbatim in CONTACT.email is `jackcutrara@gmail.com` [VERIFIED: contact.ts], which is public in HTML anyway, but the content-free discipline (Phase 7 D-36) is preserved by not threading it through Umami.

### 6.2 `.pdf` detection + resume-download early return (D-09)

```ts
const url = new URL(href, window.location.origin);
if (url.pathname.toLowerCase().endsWith(".pdf")) {
  if (url.pathname === "/jack-cutrara-resume.pdf") {
    window.umami?.track("resume_download", {
      source: window.location.pathname,
    });
    return; // D-09: do NOT reach outbound_click
  }
  window.umami?.track("outbound_click", {
    type: "pdf",
    href: `${url.hostname}${url.pathname}`,
  });
  return;
}
```

- **Case sensitivity:** use `.toLowerCase()` on pathname before `.endsWith(".pdf")` — defensive against `.PDF` variants. [VERIFIED: CONTACT.resume is `/jack-cutrara-resume.pdf` (lowercase) but defensiveness costs nothing]
- **Query strings:** `new URL(href).pathname` strips query + fragment automatically. `/resume.pdf?download=true` → pathname `/resume.pdf` → `.endsWith(".pdf")` → true. [VERIFIED: URL API spec]
- **Root-relative vs absolute:** `new URL(href, window.location.origin)` normalizes both `/jack-cutrara-resume.pdf` and `https://jackcutrara.com/jack-cutrara-resume.pdf` to the same pathname.

### 6.3 Hostname comparison (github / linkedin / external)

```ts
const hostname = url.hostname.toLowerCase();
let type: string;
if (hostname === "github.com" || hostname.endsWith(".github.com")) type = "github";
else if (hostname === "linkedin.com" || hostname === "www.linkedin.com") type = "linkedin";
else type = "external";
```

- CONTACT.github = `https://github.com/jackc625` (no `www`) [VERIFIED: contact.ts]
- CONTACT.linkedin = `https://linkedin.com/in/jackcutrara` (no `www`) [VERIFIED: contact.ts]
- **But** linkedin.com 301-redirects to www.linkedin.com in the browser — recruiters may share links with `www.` — include both in the classifier.
- GitHub also serves on `gist.github.com`, `raw.githubusercontent.com`, etc. For Phase 15 scope, `hostname.endsWith(".github.com")` coverage is sufficient (the outbound surface on this site only has `github.com/*` direct links per CONTACT.github).

### 6.4 Delegated listener pattern

```ts
document.addEventListener("click", (event) => {
  const target = event.target as Element;
  const anchor = target.closest<HTMLAnchorElement>("a");
  if (!anchor) return;
  const href = anchor.href;
  if (!href) return;
  // ... classify + track (no preventDefault)
}, { passive: true });
```

- **`closest("a")`:** handles SVG / text-node / child-element clicks inside an anchor. The Astro site has one such case — the `<a class="project-link label-mono">GITHUB &rarr;</a>` anchor on `[id].astro` — where the arrow glyph `→` is a child text node; `event.target` is the `<a>` itself, not a text node, but `closest("a")` is still correct and cheap.
- **Cmd/Ctrl-click (new tab):** native browser behavior — opens in new tab. Click event **does** fire on the anchor before navigation. Our listener emits `outbound_click` correctly in new-tab cases. [MDN — click event fires on left-mouse clicks regardless of modifier keys]
- **Middle-click:** does NOT fire `click` event on most browsers; fires `auxclick` instead. We lose middle-click outbound tracking. Acceptable for Phase 15 scope — recruiter primary interaction is left-click. [CITED: MDN auxclick]
- **Passive listener:** set `{ passive: true }` to signal we never call `preventDefault()`. Browsers can optimize scroll/touch event handling. No impact on click events but good discipline.
- **preventDefault risk:** never called. The listener is purely observational. If any classifier mis-fires, nothing breaks — the user's click still navigates.

### 6.5 Mount point

**Recommendation: mount on `document`.** Astro's BaseLayout wraps all pages, so a `document`-level delegated listener captures every anchor click site-wide. Mounting on `document.body` or a layout root offers no advantage and risks not catching header/footer/chat-widget clicks (though these all descend from `<body>`). `document` is fine.

---

## 7. Zero New Runtime Dependencies

**Confidence:** HIGH

### 7.1 package.json inventory

[VERIFIED: Read package.json]

```
"dependencies": {
  "@anthropic-ai/sdk": "^0.82.0",
  "@astrojs/cloudflare": "^13.1.7",
  "@astrojs/mdx": "^5.0.2",
  "@astrojs/sitemap": "^3.7.1",
  "@tailwindcss/vite": "^4.2.2",
  "astro": "^6.0.8",
  "astro-seo": "^1.1.0",
  "dompurify": "^3.3.3",
  "marked": "^17.0.5",
  "tailwindcss": "^4.2.2",
  "zod": "^4.3.6"
}
"devDependencies": {
  ... "jsdom": "^29.0.1", "vitest": "^4.1.0", ...
}
```

**No Umami SDK. No analytics lib. No PostHog. No testing-library.** All good.

### 7.2 Test runner + environment

- **Runner:** Vitest 4.1.0 [VERIFIED]
- **DOM environment:** jsdom 29.0.1 [VERIFIED]
- **Config:** `vitest.config.ts` uses `environment: "node"` globally; jsdom enabled per-file via `// @vitest-environment jsdom` comment [VERIFIED: Read vitest.config.ts + chat-copy-button.test.ts line 1]
- **No `@testing-library/*` packages installed.** Tests use raw DOM APIs + jsdom. `analytics.test.ts` will mirror `chat-copy-button.test.ts` shape.

### 7.3 Required mocks for `analytics.test.ts`

- **`window.umami.track`:** define on `beforeEach` as `vi.fn()` — no install needed.
- **`IntersectionObserver`:** jsdom does NOT implement it natively [ASSUMED from jsdom 29 changelog — consistent with jsdom 22+ behavior]. Must be stubbed. Minimal stub pattern:

```ts
beforeEach(() => {
  (window as any).IntersectionObserver = class {
    constructor(public cb: IntersectionObserverCallback, public opts?: IntersectionObserverInit) {}
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  };
});
```

Then the test triggers entries manually by storing the constructor's `cb` and invoking it with mock `IntersectionObserverEntry` objects.

- **`document.dispatchEvent(new CustomEvent(...))`:** works natively in jsdom.
- **Delegated click:** jsdom supports `element.click()` which bubbles.

### 7.4 Anything to add?

**No new devDeps required.** The research confirms:
- jsdom + vitest handle the full test surface (delegated clicks, CustomEvent dispatch, stubbed IntersectionObserver)
- No user-event library needed (no keyboard/accessibility-specific interactions being tested beyond simple clicks)
- No fake-timers issue (Umami tag load timing is not under test — we mock `window.umami.track`)

---

## 8. Test Strategy for `src/scripts/analytics.ts`

**Confidence:** HIGH

### 8.1 Test file structure

`tests/client/analytics.test.ts` — mirror `tests/client/chat-copy-button.test.ts` shape [VERIFIED].

Required `beforeEach`:
1. `document.body.innerHTML = ""` to reset DOM
2. Stub `window.umami = { track: vi.fn() }` so call assertions are trivial
3. Stub `IntersectionObserver` if any scroll-depth test imports the observer module
4. `vi.useFakeTimers()` only if specific timing assertions are needed (usually unnecessary)

### 8.2 Test list (RED→GREEN spec for planner)

| # | Test | Type | What it proves |
|---|------|------|----------------|
| 1 | `chat:analytics CustomEvent with action="chat_open" calls umami.track("chat_open", {})` | unit | D-11 chat-open forwarding |
| 2 | `chat:analytics with action="chip_click" and label="What projects have you built?" calls umami.track("chip_click", {label: "..."})` | unit | D-11 metadata pass-through |
| 3 | `chat:analytics with action="chat_error" and label="offline" calls umami.track("chat_error", {label: "offline"})` | unit | D-11 error forwarding |
| 4 | `chat:analytics with action="message_sent" calls umami.track("message_sent", {})` | unit | D-11 top-of-funnel |
| 5 | `chat:analytics with action="chat_truncated" calls umami.track("chat_truncated", {})` | unit | D-11 + D-14 5th action |
| 6 | `document click on <a href="https://github.com/jackc625"> calls umami.track("outbound_click", {type: "github", href: "github.com/jackc625"})` | unit | D-10 github classification |
| 7 | `document click on <a href="https://linkedin.com/in/jackcutrara"> classifies as linkedin` | unit | D-10 linkedin |
| 8 | `document click on <a href="mailto:jackcutrara@gmail.com"> stores href="mailto" not email` | unit | D-12 email policy |
| 9 | `document click on <a href="/jack-cutrara-resume.pdf"> calls umami.track("resume_download", {source}) and NOT outbound_click` | unit | D-09 dedup |
| 10 | `document click on <a href="https://example.com/foo?bar=baz#frag"> stores href="example.com/foo" (no query/fragment)` | unit | D-12 href stripping |
| 11 | `document click on <a href="https://example.com/download.pdf"> (non-resume pdf) emits outbound_click with type="pdf"` | unit | D-10 pdf path (non-resume) |
| 12 | `document click on non-anchor element (bubble up from <p>) does not fire umami.track` | unit | classifier resilience |
| 13 | `IntersectionObserver callback with entry.target.dataset.percent="50" fires umami.track("scroll_depth", {percent: 50, slug})` | unit | D-06/D-07 scroll depth |
| 14 | `IntersectionObserver unobserve called on fired sentinel (observer.unobserve(entry.target))` | unit | D-08 one-shot |
| 15 | `window.umami undefined (not loaded yet) — track calls do not throw` | unit | optional-chaining safety |

All tests run in jsdom. No need for browser-env.

### 8.3 Analytics module shape

Recommend exporting pure helper functions alongside the install-time side-effect:

```ts
// src/scripts/analytics.ts

// Pure, testable
export function classifyOutbound(href: string): { type: string; href: string } | null {
  // ... returns null for same-origin non-pdf non-mailto, else classification
}

export function handleChatAnalytics(detail: { action: string; label?: string }) {
  const payload = detail.label ? { label: detail.label } : {};
  window.umami?.track(detail.action, payload);
}

// Install side-effect (IIFE or fire-and-forget)
if (typeof document !== "undefined") {
  document.addEventListener("chat:analytics", (e: Event) => {
    handleChatAnalytics((e as CustomEvent).detail);
  });
  document.addEventListener("click", delegatedClickHandler, { passive: true });
  // ... scroll-depth observer init
}
```

This lets tests import `classifyOutbound` and `handleChatAnalytics` directly without triggering the install-time listeners (same pattern as `createCopyButton` export from chat.ts).

---

## 9. D-26 Chat Regression Gate — Client-Only Surface Map (per D-15)

**Confidence:** HIGH

### 9.1 What changes (Phase 15 chat.ts surface)

- **`src/scripts/chat.ts`:** 4 new lines inserted in the SSE parse loop (line ~190) — the `if (parsed.truncated === true) { trackChatEvent("chat_truncated"); continue; }` guard.
- **`src/pages/api/chat.ts`:** BYTE-IDENTICAL (D-15 lock).

### 9.2 D-26 9-item breakdown (Phase 7 regression battery)

[CITED: ROADMAP.md §Cross-Phase Constraints]

| # | D-26 Item | Affected by Phase 15? | Re-run required |
|---|-----------|----------------------|-----------------|
| 1 | **XSS sanitization** (DOMPurify strict, markdown render) | NO — markdown pipeline untouched | Run `tests/client/markdown.test.ts` (fast). Expect GREEN unchanged. |
| 2 | **CORS (exact origin)** | NO — server byte-identical | Skip (server untouched) |
| 3 | **Rate limit (5/60s CF binding)** | NO — server byte-identical | Skip |
| 4 | **30s AbortController timeout** | NO — timeout logic at chat.ts:147-148 unchanged | Skip |
| 5 | **Focus trap re-query** | NO — setupFocusTrap untouched | Run `tests/client/focus-visible.test.ts`. Expect GREEN unchanged. |
| 6 | **localStorage persistence (50-msg / 24h)** | NO — saveChatHistory/loadChatHistory untouched | Run `tests/client/chat-copy-button.test.ts` idempotency + optional dedicated test. GREEN unchanged. |
| 7 | **SSE streaming (line-by-line delta)** | YES (additive) — new `if (parsed.truncated)` guard inside parse loop. Does not change delta handling for non-truncated frames. | Run `tests/api/chat.test.ts` + add integration smoke that feeds `data: {"truncated":true}\n\ndata: [DONE]\n\n` and asserts (a) no `onToken("undefined")` call, (b) `chat:analytics` dispatched with `action: "chat_truncated"`. GREEN both paths. |
| 8 | **Markdown rendering (DOMPurify strict)** | NO — renderMarkdown untouched | Run `tests/client/markdown.test.ts`. GREEN unchanged. |
| 9 | **Copy button parity (live vs replay)** | NO — createCopyButton untouched | Run `tests/client/chat-copy-button.test.ts`. GREEN unchanged. |

### 9.3 Minimal D-26 test command for Phase 15

```bash
pnpm test -- tests/api/chat.test.ts tests/client/markdown.test.ts tests/client/chat-copy-button.test.ts tests/client/focus-visible.test.ts tests/client/analytics.test.ts
```

(Plus any new `tests/client/sse-truncation.test.ts` if the planner chooses to author one.)

### 9.4 Lighthouse CI gate

Run the standard homepage + `/projects/seatwatch` pair. Expected deltas from Phase 15:
- **Performance:** unchanged (≥99). Umami adds 2KB deferred JS; negligible against a warm budget.
- **Accessibility:** unchanged (95). Sentinel divs are `aria-hidden="true"`.
- **Best Practices:** unchanged (100). All external scripts are HTTPS.
- **SEO:** unchanged (100 on production).

**Budget risk:** the 2KB Umami defer fetches over the network during `onload` window. If the waterfall shows it delaying `interactive`, move the script to document-end `<body>` (or rely purely on `defer`). **Do not host Umami locally** — the Cloud version is cached globally via Umami's CDN.

---

## 10. Validation Architecture (feeds 15-VALIDATION.md — Nyquist Dimension 8)

**Confidence:** HIGH (test seams identified); MEDIUM (live-dashboard verifications require post-deploy)

### 10.1 Validation seams

Every observable point where Phase 15 behavior can be mechanically verified:

| # | Seam | Where | Observable |
|---|------|-------|------------|
| S1 | Umami script tag presence in prod build HTML | `pnpm build` output: grep `dist/client/index.html` for `cloud.umami.is/script.js` | Literal string match |
| S2 | Umami script tag ABSENCE in dev HTML | `curl http://localhost:4321/ \| grep cloud.umami.is` returns empty | Absence |
| S3 | `data-website-id` attribute is the static literal | DOM parse of prod build HTML | `data-website-id="<UUID>"` exact match |
| S4 | `data-domains="jackcutrara.com"` in prod HTML | DOM parse of prod build HTML | exact match |
| S5 | `is:inline` + `defer` preserved (no Astro-bundled rewrite) | `dist/client/index.html` inspection | `src="https://cloud.umami.is/script.js"` external URL intact |
| S6 | `chat:analytics` listener registered at `document` | Unit test — dispatch `chat:analytics` CustomEvent; assert `window.umami.track` called | vi.fn() call assertion |
| S7 | Delegated click on anchor calls `umami.track("outbound_click", ...)` | Unit test — inject `<a href="...">`, `.click()`, assert mock | vi.fn() call assertion |
| S8 | `.pdf` early-return prevents double-fire | Unit test — click `<a href="/jack-cutrara-resume.pdf">`; assert `resume_download` fired AND `outbound_click` NOT fired | vi.fn() call count |
| S9 | IntersectionObserver constructed on `/projects/[id]` only | Unit test — verify presence of `.scroll-sentinel` gates observer construction | `IntersectionObserver` constructor call count |
| S10 | IntersectionObserver NOT constructed on `/`, `/about`, `/projects`, `/contact` | Unit test — each route's DOM has zero `.scroll-sentinel` elements | Constructor call count == 0 |
| S11 | `observer.unobserve(entry.target)` called on fire (D-08 one-shot) | Unit test — fire entry twice, assert second entry does nothing | vi.fn() call count |
| S12 | SSE `data: {"truncated":true}` frame dispatches `chat:analytics` with `action: "chat_truncated"` | Unit test — mock ReadableStream with truncated frame + [DONE]; assert CustomEvent dispatched | `document.addEventListener("chat:analytics", spy)` call assertion |
| S13 | SSE truncated frame does NOT call `onToken` | Unit test — assert `onToken` not invoked with undefined | Mock spy count |
| S14 | `window.umami?.track(...)` handles undefined gracefully | Unit test — with `window.umami` undefined, dispatch `chat:analytics`; assert no throw | No-throw assertion |
| S15 | CF Web Analytics beacon present in prod HTML response | `curl https://jackcutrara.com/ \| grep cloudflareinsights` | Post-deploy curl — NOT buildable locally (CF injects at edge) |

### 10.2 Observability boundaries

| Layer | Verifiable How? |
|-------|-----------------|
| **Unit (vitest + jsdom)** | S6, S7, S8, S9, S10, S11, S12, S13, S14 — pure client logic; mocks for `window.umami.track` + stubbed IntersectionObserver |
| **Build-output inspection (grep on dist/)** | S1, S2, S3, S4, S5 — static HTML assertions |
| **Integration (vitest + crafted ReadableStream)** | S12, S13 — feed canned SSE bytes into the parser |
| **Manual Umami-dashboard check (post-deploy)** | event end-to-end: "after 24h on jackcutrara.com, Umami dashboard shows `chat_open`, `message_sent`, `resume_download`, `scroll_depth`, `outbound_click`" |
| **Manual CF dashboard check (post-deploy)** | S15 + Core Web Vitals appearing in CF Web Analytics dashboard |
| **Lighthouse CI** | no regression in Performance / A11y / BP / SEO |

### 10.3 Detection gaps (ONLY verifiable post-deploy)

| Gap | Why unverifiable in CI | Mitigation |
|-----|------------------------|-------------|
| Events actually reach Umami's backend | Requires a live website with production `data-website-id` and real user traffic | `15-VERIFICATION.md` mandates dashboard screenshot showing ≥1 of each event type after 24h of traffic |
| CF Web Analytics beacon auto-inject | CF edge proxy injects only for real production hostnames | Manual `curl -v https://jackcutrara.com/` header + body check; verify `<script … cloudflareinsights …>` present |
| `data-domains` server-side filter actually drops non-match | Umami's backend logic — no public observability | Smoke test: in Umami dashboard, verify zero events from `*.pages.dev` hostnames after an exec deploy |
| Core Web Vitals reporting actually populates CF dashboard | Requires LCP/CLS/INP to be measured across real visitors | Post-deploy "3-day waterfall" screenshot in `15-VERIFICATION.md` |
| Rate-limiting of Umami (if recruiter sits on page clicking everything) | Not a first-order concern; Umami Cloud free tier is 100k events/mo | Out of scope |

### 10.4 Gap-closing tests (Nyquist Dimension 8)

Concrete test names to author — feeds directly into `15-VALIDATION.md`:

```
tests/client/analytics.test.ts:
  describe("chat:analytics forwarding (D-11)")
    it("forwards chat_open with empty metadata")
    it("forwards chip_click with label in metadata")
    it("forwards chat_error with label='offline'")
    it("forwards message_sent")
    it("forwards chat_truncated (D-14)")
    it("silently no-ops when window.umami undefined")

  describe("outbound classifier (D-10, D-12)")
    it("classifies github.com as type=github")
    it("classifies linkedin.com as type=linkedin")
    it("classifies mailto: as type=email with href='mailto'")
    it("classifies external .pdf as type=pdf")
    it("strips query/fragment from href metadata")
    it("ignores clicks not inside an anchor")
    it("handles anchor child clicks via closest('a')")

  describe("resume-download dedup (D-09)")
    it("fires resume_download for /jack-cutrara-resume.pdf")
    it("does NOT fire outbound_click for /jack-cutrara-resume.pdf")
    it("resume_download carries {source: pathname} metadata")

  describe("scroll-depth observer (D-05, D-06, D-07, D-08)")
    it("constructs observer only when .scroll-sentinel present in DOM")
    it("fires scroll_depth at 25% with correct percent + slug")
    it("fires each threshold exactly once per page-view (unobserve)")
    it("ignores non-intersecting entries")

tests/client/sse-truncation.test.ts:  // NEW — covers D-14 + D-15
  describe("SSE truncation frame (D-14, D-15)")
    it("parses {truncated: true} frame and dispatches chat:analytics with action=chat_truncated")
    it("does not call onToken with undefined when truncated frame arrives")
    it("continues draining stream after truncated frame until [DONE]")
    it("non-truncated responses do not dispatch chat_truncated")

tests/build/umami-tag-present.test.ts:  // NEW — build-output inspection
  describe("Umami tag (ANAL-01, D-01, D-02, D-03)")
    it("appears in dist/client/index.html after pnpm build")
    it("has data-website-id=<UUID>")
    it("has data-domains='jackcutrara.com'")
    it("has defer attribute")
    it("is inside <head>")
    it("appears after <SEO> injected elements (canonical <link>)")
```

### 10.5 Per-requirement validation table (copy into 15-VALIDATION.md)

| Req | Behavior | Test Type | Command | Detection Gap |
|-----|----------|-----------|---------|--------------|
| ANAL-01 | Umami tag in prod HTML, absent in dev | build-output | `pnpm build && grep cloud.umami.is dist/client/index.html` + `astro dev && curl localhost:4321 \| grep cloud.umami.is` | None |
| ANAL-02 | CF Web Analytics enabled; beacon present | manual | `curl -s https://jackcutrara.com/ \| grep cloudflareinsights` | Beacon injection is edge-dependent — post-deploy only |
| ANAL-03 | chat:analytics → Umami forwarder | unit | `pnpm test -- tests/client/analytics.test.ts` | End-to-end Umami dashboard event confirmation is post-deploy |
| ANAL-04 | Delegated outbound click → Umami | unit | `pnpm test -- tests/client/analytics.test.ts` | Same dashboard confirmation post-deploy |
| ANAL-05 | Resume dl, chat open, outbound, scroll-depth all visible | unit + manual | `pnpm test` (all above) + 24h dashboard screenshot | Dashboard screenshot required |
| ANAL-06 | No cookie-consent banner required | manual inspection | DevTools Application → Cookies on jackcutrara.com → zero Umami or CF cookies set | None (Umami + CF Web Analytics are cookie-free by contract) |

### 10.6 Sampling rate

- **Per task commit:** `pnpm test -- tests/client/analytics.test.ts tests/client/sse-truncation.test.ts` (~2s)
- **Per wave merge:** `pnpm test` (full suite) + `pnpm build && grep dist/` smoke
- **Phase gate:** full suite green + Lighthouse CI + Umami dashboard screenshot in `15-VERIFICATION.md` + CF Web Analytics dashboard screenshot

### 10.7 Wave 0 gaps

- [ ] `tests/client/analytics.test.ts` — NEW (covers S6-S11, S14, ANAL-03, ANAL-04, ANAL-05)
- [ ] `tests/client/sse-truncation.test.ts` — NEW (covers S12, S13, D-14, D-15)
- [ ] `tests/build/umami-tag-present.test.ts` — NEW (covers S1-S5, ANAL-01)
- [ ] `15-VERIFICATION.md` — NEW (dashboard screenshots + D-26 client-only checklist + cookie audit for ANAL-06)

No framework install needed — vitest + jsdom cover everything.

---

## 11. Security Domain

**Confidence:** HIGH

`.planning/config.json` does not explicitly disable security enforcement, so it defaults to enabled.

### 11.1 Applicable ASVS categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface touched (API endpoints byte-identical per D-15) |
| V3 Session Management | no | No sessions; Umami is cookie-free by contract |
| V4 Access Control | no | No privileged surfaces added |
| V5 Input Validation | partial | `closest("a").href` is a URL; `new URL(href, ...)` throws on malformed — guard with try/catch |
| V6 Cryptography | no | No crypto surface |
| V14 Config | yes | `data-website-id` in source code (public); CF Web Analytics token in dashboard (public by design) |

### 11.2 Known threat patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Outbound-tracking leak of private URLs (chat history, auth tokens in URL) | Information Disclosure | D-12 href metadata policy = hostname + pathname ONLY (no query, no fragment). `mailto:` stored as literal `"mailto"` not email. |
| Umami script supply-chain attack (compromised `cloud.umami.is`) | Tampering | Accepted risk (Umami is self-hosted on CF infra; SRI not feasible for auto-updating tracker) |
| Scroll-depth sentinel XSS (if any content contains unsafe markdown) | XSS | Scroll sentinels are static `<div aria-hidden>` in an Astro layout — no user content flows through them |
| Click-event injection via malicious anchor | Injection | Classifier uses `new URL(href, origin)` which normalizes; no string concatenation into executable contexts |
| CustomEvent tampering (a malicious script dispatches fake `chat:analytics`) | Spoofing | In-scope script already runs in same origin; `chat:analytics` is a loose contract by design (Phase 7 D-36 content-free payload); worst case is a fake `chat_open` in Umami — operational signal only, not a security boundary |
| Preview-deploy events polluting production Umami | Integrity | D-01 belt-and-suspenders: PROD guard + `data-domains` server-side drop |

All risks are **operational noise** not classical vulnerabilities — Phase 15 adds no new security-critical surface. The resume PDF is public already (in CONTACT.resume), github URL is public, linkedin URL is public. Tracking them says "someone clicked" — does not leak anything not already public.

---

## Files to Create / Modify (consolidated)

| File | Status | Lines changed | Purpose |
|------|--------|--------------|---------|
| `src/layouts/BaseLayout.astro` | MODIFY | +6 (insert after `<SEO>` block around line 80) | Umami tag inside `{import.meta.env.PROD && <script is:inline defer …/>}` |
| `src/scripts/analytics.ts` | CREATE | ~150 | chat:analytics forwarder + delegated outbound listener + scroll-depth observer |
| `src/pages/projects/[id].astro` | MODIFY | +4 sentinels + `.project-article { position: relative }` + CSS for `.scroll-sentinel` (~10 lines) | Scroll-depth sentinel insertion |
| `src/scripts/chat.ts` | MODIFY | +4 lines (after line ~194, inside the try block) | D-14 truncated-frame parser |
| `src/pages/api/chat.ts` | **UNTOUCHED** | 0 | D-15 lock |
| `tests/client/analytics.test.ts` | CREATE | ~200 | Unit tests for forwarder + classifier + observer |
| `tests/client/sse-truncation.test.ts` | CREATE | ~80 | Unit test for D-14 truncated frame parse |
| `tests/build/umami-tag-present.test.ts` | CREATE | ~50 | Build-output grep assertions for S1-S5 |
| `.planning/phases/15-analytics-instrumentation/15-VERIFICATION.md` | CREATE | — | D-26 client-only checklist + Umami dashboard screenshot + CF Web Analytics screenshot + cookie audit |
| `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md` | CREATE | — | Backlog todo for D-13 deferred scope |

**Where to wire `analytics.ts` into the page:** Import via an Astro `<script>` block in `BaseLayout.astro` `<body>` (near the chat widget import). This makes the delegated listener mount once per full page-load. Because there's no `<ClientRouter />`, the listener re-mounts cleanly on each navigation.

```astro
<script>
  import "../scripts/analytics";
</script>
```

---

## Risks & Landmines

### L1: `data-domains` subdomain strict-match

**Trap:** adding `www.` or a second custom domain later without updating `data-domains` causes silent event drops.
**Mitigation:** document in `15-VERIFICATION.md` as a "when to update" note — tied to any future DNS change.

### L2: `async` + `defer` combined — `async` wins

**Trap:** CONTEXT.md D-02 says "async+defer"; HTML spec says async overrides defer, and Umami's reference snippet uses defer only.
**Mitigation:** planner picks `defer` only. Write a single-line note in the plan justifying the deviation from CONTEXT.md wording (spirit preserved: non-blocking; letter refined: defer is correct per vendor docs).

### L3: Astro `<script>` MUST use `is:inline` for external src

**Trap:** omitting `is:inline` makes Astro attempt to bundle `https://cloud.umami.is/script.js` as a local module → build error or broken data-* attrs.
**Mitigation:** explicit `is:inline` on the tag, plus a comment in BaseLayout.astro. Build-output test (`tests/build/umami-tag-present.test.ts`) catches any drift.

### L4: Conditional rendering via `{import.meta.env.PROD && <script/>}` must live in `.astro` template, not inside a `<script>` block

**Trap:** wrapping the tag in a `<script is:inline>{import.meta.env.PROD && "..."}</script>` treats the condition as a runtime string, not a build-time conditional. Script fires on dev too.
**Mitigation:** put the `{…}` expression in the Astro JSX template position (between other HTML elements in the `<head>`), NOT inside another script.

### L5: IntersectionObserver not in jsdom

**Trap:** tests fail with `IntersectionObserver is not defined`.
**Mitigation:** stub in `beforeEach` per §7.3. Document the stub pattern in the plan.

### L6: Duplicate observer on re-navigation

**Trap:** if `astro:page-load` fires twice (unlikely without ClientRouter but historically a risk), two observers watch the same sentinels.
**Mitigation:** module-level `scrollObserverInitialized` boolean + `.scroll-sentinel` presence check. Mirrors chat.ts `chatInitialized` pattern.

### L7: SSE parser `onToken(undefined)` render bug

**Trap:** without the new guard, receiving `data: {"truncated":true}` runs `onToken(parsed.text)` → `onToken(undefined)` → renders the string "undefined" into the bot bubble.
**Mitigation:** the `continue` after `trackChatEvent("chat_truncated")` skips the onToken call. Test case explicitly asserts "onToken NOT called with undefined."

### L8: CF Web Analytics auto-inject failing silently on custom domains

**Trap:** CF edge proxy regression causes the beacon not to inject; dashboard sits empty.
**Mitigation:** `15-VERIFICATION.md` mandates `curl https://jackcutrara.com/ | grep cloudflareinsights` + actual Network tab screenshot of beacon request. Fallback path (explicit `<script>` in BaseLayout with PROD gate) pre-approved via CONTEXT.md Claude's Discretion.

### L9: Lighthouse regression from the defer-loaded Umami tag

**Trap:** tag lands in critical-render path somehow and pushes TTI.
**Mitigation:** Umami script is 2KB gzip, loads deferred, does nothing synchronous on main thread. Standard Lighthouse test suite catches regression. If a regression appears: move to `<body>` end or test with `async` only.

### L10: `window.umami` racing with early clicks

**Trap:** user clicks an outbound link within the first ~30ms of page load, before `cloud.umami.is/script.js` executes → `window.umami?.track(...)` no-ops silently.
**Mitigation:** acceptable — lost early events are a known limitation of ALL deferred analytics tags. Not worth buffering. The first recruiter interaction is always >200ms post-load.

### L11: Middle-click outbound tracking is missed

**Trap:** recruiters who middle-click to open social links in new tab do not generate `outbound_click` events.
**Mitigation:** acceptable — primary outbound is left-click. If this becomes a signal, add an `auxclick` listener later.

### L12: Content-free discipline drift

**Trap:** future contributor adds the user's email or name to an event payload, breaking Phase 7 D-36.
**Mitigation:** D-12 href policy is documented in `15-VERIFICATION.md`. Drift-guard test in `tests/client/analytics.test.ts` asserts: "outbound_click metadata never contains `@` character" (proxy for no email addresses leaking).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `cloud.umami.is/script.js` will remain a stable URL through v1.2 lifecycle | §1.1 | Low — Umami has shipped this URL for 3+ years; if it changed, monitoring fires immediately |
| A2 | `import.meta.env.PROD` evaluates to `true` in the Cloudflare adapter build output (not just node adapter) | §3.2 / L4 | Low — confirmed fixed in Astro issue #9515 (resolved); Cloudflare adapter uses Astro's standard build pipeline |
| A3 | jsdom 29.0.1 does NOT ship a native IntersectionObserver | §7.3 | Low — consistent with jsdom 22+ per community reports; verified by search; if jsdom 29 unexpectedly shipped one, our stub still works as a superset |
| A4 | CF Web Analytics auto-inject works for Cloudflare Pages custom domains (jackcutrara.com) without additional config | §4.1 | MEDIUM — some community threads report regressions; hence the D-04 fallback path is already approved in CONTEXT.md |
| A5 | `umami.track()` metadata object with `{label: "..."}` safely renders in Umami dashboard as a filterable metadata field | §1.6 | Low — metadata is Umami's advertised flexibility feature |
| A6 | The 15-30ms window where `window.umami` is undefined does not materially affect recruiter-engagement measurement | §1.4 | Low — first interaction is always >200ms from page-load in real browsing |
| A7 | `data-domains="jackcutrara.com"` server-side drop is enforced by Umami's ingest pipeline (documented behavior) | §1.2 | Low — documented on Umami's docs page; community threads confirm behavior |

---

## Open Questions (RESOLVED)

1. **Exact Umami UUID to commit in D-03**
   - What we know: must be a UUID string; static literal in BaseLayout.astro.
   - What's unclear: the actual UUID to use — Jack generates this during Umami Cloud website-entry creation.
   - Recommendation: planner authors BaseLayout.astro with a placeholder like `const WEBSITE_ID = "TODO_PHASE_15_UMAMI_ID";` and adds a pre-deploy Task in `15-VERIFICATION.md` for Jack to replace it before merge.
   - **RESOLVED:** Plan 01 Task 2 ships `data-website-id="TODO_PHASE_15_UMAMI_ID"` placeholder; Plan 05 Task 3 checkpoint blocks on Jack committing real UUID pre-deploy.

2. **Fallback CF Web Analytics token if auto-inject fails**
   - What we know: CF dashboard issues a token if manual path is chosen.
   - What's unclear: whether auto-inject WILL work.
   - Recommendation: plan assumes happy path (D-04); plan includes a branched fallback task gated on verification result.
   - **RESOLVED:** Plan 05 §5 post-deploy curl + grep check; fallback explicit `<script>` in BaseLayout documented in Plan 05 §5.2.

3. **`motion.ts` consolidation in Phase 16**
   - What we know: Phase 16 ships `motion.ts` for scroll-reveal (MOTN-02) using IntersectionObserver on the same route.
   - What's unclear: whether Phase 16 wants to consolidate Phase 15's scroll-depth observer into a shared base.
   - Recommendation: Phase 15 ships scroll-depth as its own closure/file. Phase 16 refactors if/when it sees a clean factoring. Don't preemptively couple.
   - **RESOLVED:** Plan 03 ships scroll-depth.ts as its own file per CONTEXT.md Claude's Discretion; Phase 16 may refactor later.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, tests | ✓ | 22.x LTS | — |
| pnpm | Package manager | ✓ | 10.x | — |
| vitest | Test runner | ✓ | 4.1.0 | — |
| jsdom | DOM env | ✓ | 29.0.1 | — |
| Umami Cloud account | ANAL-01 live verification | operational | — | Jack sets up before merge |
| Cloudflare Pages dashboard access | ANAL-02 toggle | operational | — | Jack toggles before merge |
| Cloudflare Pages project for jackcutrara.com | Production deploy | ✓ | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

All technical dependencies satisfied. Operational dependencies (Umami account + CF dashboard toggle) are Jack's pre-deploy tasks, documented in the VERIFICATION checklist.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| DOM env | jsdom 29.0.1 (per-file via `// @vitest-environment jsdom`) |
| Config file | `vitest.config.ts` (node env globally, jsdom per file) |
| Quick run command | `pnpm test -- tests/client/analytics.test.ts tests/client/sse-truncation.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANAL-01 | Umami tag present in prod build, absent in dev | build-output | `pnpm test -- tests/build/umami-tag-present.test.ts` | Wave 0 (NEW) |
| ANAL-02 | CF Web Analytics beacon present in production HTML | manual | `curl -s https://jackcutrara.com/ \| grep cloudflareinsights.com` | manual post-deploy |
| ANAL-03 | chat:analytics forwarder dispatches to Umami for all 5 actions (D-11 + D-14) | unit | `pnpm test -- tests/client/analytics.test.ts` | Wave 0 (NEW) |
| ANAL-04 | Delegated outbound click emits Umami event with D-10 taxonomy + D-12 href policy | unit | `pnpm test -- tests/client/analytics.test.ts` | Wave 0 (NEW) |
| ANAL-05 | Resume dl, chat open, outbound, scroll-depth all fire correctly | unit + manual dashboard | `pnpm test -- tests/client/analytics.test.ts` + 24h Umami dashboard screenshot | Wave 0 (NEW) + VERIFICATION.md |
| ANAL-06 | No cookie-consent banner required (zero cookies set by Umami or CF) | manual | DevTools Application → Cookies → assert zero Umami/CF cookies | manual post-deploy |
| D-14 | Server SSE `truncated: true` frame dispatches `chat_truncated` via `chat:analytics` | unit | `pnpm test -- tests/client/sse-truncation.test.ts` | Wave 0 (NEW) |
| D-15 | `src/pages/api/chat.ts` byte-identical | static | `git diff HEAD~ -- src/pages/api/chat.ts` exits with zero output | — (git check) |
| D-09 | `/jack-cutrara-resume.pdf` fires ONLY `resume_download` (not `outbound_click`) | unit | assert vi.fn() call counts | Wave 0 (NEW) |
| D-26 | Client-only regression (XSS, copy, focus, localStorage, SSE, markdown) | unit | `pnpm test` (all 5 existing test files) | ✓ Exists |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/client/analytics.test.ts tests/client/sse-truncation.test.ts` (~2s)
- **Per wave merge:** `pnpm test` (full suite, ~15s) + `pnpm build` clean + `grep cloud.umami.is dist/client/index.html`
- **Phase gate:** full suite green + Lighthouse CI pair (home + /projects/seatwatch) + `/gsd-verify-work` + Jack's post-deploy dashboard screenshots

### Wave 0 Gaps

- [ ] `tests/client/analytics.test.ts` — NEW — covers ANAL-03, ANAL-04, ANAL-05, D-09, D-10, D-11, D-12
- [ ] `tests/client/sse-truncation.test.ts` — NEW — covers D-14, D-15 (client side)
- [ ] `tests/build/umami-tag-present.test.ts` — NEW — covers ANAL-01 build-output assertions
- [ ] `src/scripts/analytics.ts` — NEW (module under test)
- [ ] `15-VERIFICATION.md` — NEW — D-26 client-only 9-item checklist + dashboard screenshot placeholders + cookie audit script
- [ ] `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md` — NEW — D-13 deferred scope

No framework install required. Vitest + jsdom + native DOM APIs cover every seam.

---

## Sources

### Primary (HIGH confidence)

- **Umami Tracker Configuration** — https://docs.umami.is/docs/tracker-configuration — full attribute list, `data-domains` strict-match behavior
- **Umami Tracker Functions** — https://docs.umami.is/docs/tracker-functions — `umami.track()` 4-overload signatures
- **Umami Event Data limits** — https://docs.umami.is/docs/event-data — 500-char strings, 50-property objects
- **Umami Track Events** — https://docs.umami.is/docs/track-events — `window.umami.track()` call pattern
- **Cloudflare Pages Web Analytics how-to** — https://developers.cloudflare.com/pages/how-to/web-analytics/ — dashboard toggle, auto-inject path
- **Cloudflare Web Analytics Get Started** — https://developers.cloudflare.com/web-analytics/get-started/ — beacon auto-injection + orange-cloud requirement + Cache-Control no-transform gotcha
- **Astro Client-Side Scripts** — https://docs.astro.build/en/guides/client-side-scripts/ — `<script>` bundling, `is:inline`, external src handling
- **Astro Environment Variables** — https://docs.astro.build/en/guides/environment-variables/ — `import.meta.env.PROD` build-time static replacement
- **MDN IntersectionObserver** — https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API — threshold / rootMargin semantics
- **MDN auxclick event** — middle-click does not fire `click`
- **HTML Living Standard (script element)** — `async` + `defer` interaction, async wins
- **Live fetch of https://cloud.umami.is/script.js** (2026-04-23) — confirmed `window.umami = {track, identify, getSession}`
- **Repo files** — `src/layouts/BaseLayout.astro`, `src/scripts/chat.ts`, `src/pages/api/chat.ts`, `src/pages/projects/[id].astro`, `src/data/contact.ts`, `package.json`, `vitest.config.ts`, `tests/client/chat-copy-button.test.ts`, `src/components/JsonLd.astro` (is:inline precedent) — all read verbatim during research

### Secondary (MEDIUM confidence — verified by multiple sources)

- **Umami event timing pattern** — https://github.com/umami-software/umami/discussions/3034 — `beforeInteractive` / onload callback / optional-chaining fallback
- **Cloudflare custom-domain regressions** — community threads on script injection inconsistency (documented in §4.5)
- **jsdom IntersectionObserver absence** — community reports (§7.3) — mitigated by stub pattern

### Tertiary (LOW confidence — flagged for post-deploy validation)

- **CF Web Analytics auto-inject on Pages custom domain (jackcutrara.com specifically)** — happy path documented, but A4 needs production validation via `curl` + DevTools Network tab

---

## Project Constraints (from CLAUDE.md)

Extracted from `C:\Users\jackc\Code\portfolio\CLAUDE.md`:

1. **Design process:** All visual/UI/UX decisions routed through frontend-design skill. Phase 15 adds no visual surface (sentinels are `aria-hidden` invisible) → COMPLIANT.
2. **Tech stack:** Astro 6 + Tailwind v4 + TypeScript 5.9 + GSAP removed → §3 confirms script shape; no stack deviation.
3. **Editorial design system** locked — six hex tokens, seven typography roles; no dark mode; restrained motion. Phase 15 adds zero visual surface → COMPLIANT.
4. **Zero new runtime deps on preferred path.** §7 confirms no deps required → COMPLIANT.
5. **D-26 Chat Regression Gate** applies to BaseLayout + chat.ts changes → §9 maps every D-26 item to the Phase 15 surface; client-only per D-15.
6. **Lighthouse CI Gate (99/95/100/100)** — §9.4 documents expected deltas; no regression forecast.
7. **MASTER.md §8 anti-pattern list intact** — Phase 15 does not add motion, GSAP, ClientRouter, etc. → COMPLIANT.
8. **GSD workflow enforcement** — this research file is produced under `/gsd-research-phase`/`/gsd-plan-phase` as mandated.
9. **Mailto voice contract** — contact.ts content-free discipline in D-12 maps directly.

---

## Metadata

**Confidence breakdown:**
- Standard stack (Umami, CF Web Analytics, Astro 6 script semantics): HIGH — confirmed via official docs + live fetch
- Architecture (IntersectionObserver pattern, SSE parser additive diff, delegated click): HIGH — direct source inspection + MDN
- Pitfalls (D-26 client-only map, async+defer interaction, Astro `<script>` is:inline requirement): HIGH — repeated cross-confirmation
- Zero-dep verification: HIGH — package.json inspection
- CF Web Analytics Pages custom-domain auto-inject (A4): MEDIUM — known community regressions; fallback pre-approved

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (30 days — stable stack, no fast-moving APIs in scope)
