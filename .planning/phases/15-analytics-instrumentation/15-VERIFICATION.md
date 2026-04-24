---
phase: 15
slug: analytics-instrumentation
status: human_needed
verified: 2026-04-23T00:00:00Z
score: 4/4 must-haves verified (codebase surface) — pre-deploy operational items + production dashboard checks pending Jack
verifier: claude (gsd-verifier)
codebase_status: passed
human_verification_required: yes
overrides_applied: 0
d26_compliant: null
lighthouse_compliant: null
created: 2026-04-23
gaps: []
deferred: []
---

# Phase 15 — Verification

Evidence capture for the Phase 15 Analytics Instrumentation milestone. Scaffold authored during Plan 15-05. Augmented with verifier-authored automated verification results during `/gsd-verify-work` on 2026-04-23. Awaiting Jack's pre-deploy + post-deploy operational checks (§§1, 4–9).

Phase 15 is a **client-only + zero-runtime-dep phase** by design (D-15). Server (`src/pages/api/chat.ts`) is byte-identical; D-26 gate collapses to the client-only subset per RESEARCH §9.2.

---

## Automated Verification Results (verifier-authored 2026-04-23)

This section documents goal-backward verification of the Phase 15 codebase against the four ROADMAP success criteria. Sections 1–10 below remain Jack's pre-deploy + post-deploy operational checklist (status reflects current state, not invalidated by this section).

### Phase Goal Recap

> "Jack can observe recruiter engagement on the live site — resume downloads, chat opens, outbound link clicks, and project scroll depth — via a Umami dashboard that fires only on production, uses zero cookies, and requires no consent banner."

### Must-Haves Verified

| # | Truth (Success Criterion) | Status | Evidence |
|---|--------------------------|--------|----------|
| 1 | Umami dashboard receives pageview + custom events from `jackcutrara.com` only — local dev / preview / non-prod hostnames emit nothing | PASSED (codebase) — needs human (production) | Source-side: `BaseLayout.astro:93` wraps `<script is:inline defer src="https://cloud.umami.is/script.js" data-website-id={WEBSITE_ID} data-domains="jackcutrara.com" />` in `{import.meta.env.PROD && ...}` (D-01 belt-and-suspenders); `data-domains` is the second filter at the Umami ingest layer. Verified by `tests/build/umami-tag-present.test.ts` (7 GREEN). Production dashboard event reception itself requires §4 human check. |
| 2 | Recruiter-engagement events are visible end-to-end: resume PDF download, chat widget open, outbound social/mailto clicks, project-page scroll depth | PASSED (codebase) — needs human (production) | All client emit-paths shipped: (a) `analytics.ts:117` resume `/jack-cutrara-resume.pdf` early-return → `umami.track("resume_download", {source: location.pathname})`; (b) `chat.ts:380` (pre-existing Phase 7) dispatches `chat:analytics{action:"chat_open"}` → `analytics.ts:94` listener → `umami.track`; (c) `analytics.ts:128` outbound classifier → `umami.track("outbound_click", classification)` for github/linkedin/email/external/pdf; (d) `scroll-depth.ts:32` IntersectionObserver one-shot at 25/50/75/100% on `/projects/[id]` sentinels → `umami.track("scroll_depth", {percent, slug})`. Production reception requires §4 human check. |
| 3 | Existing `chat:analytics` CustomEvent (content-free per Phase 7 D-36) forwards to Umami via `src/scripts/analytics.ts` with no new PII exposure and no change to Phase 7 streaming semantics | PASSED | `analytics.ts:82-85` `handleChatAnalytics` forwards `detail.action` + optional `detail.label` only; `timestamp` is dropped (Phase 7 D-36 preserved). `grep -c "jackcutrara@gmail.com" src/scripts/analytics.ts = 0` (D-12 email-leak guard). D-15 server byte-identical: `git diff 6018021 HEAD -- src/pages/api/chat.ts | wc -l = 0`. SSE truncation guard at `chat.ts:199-202` is strict-equality (`parsed.truncated === true`) + `continue` (L7 mitigation — never calls `onToken(undefined)`). 4 SSE-truncation tests + 15 analytics tests + D-26 client-only regression battery all GREEN per Plan 02/04 SUMMARY (`pnpm test` 262/262). |
| 4 | Cloudflare Web Analytics is live as the secondary CWV source, and the site ships without a cookie-consent banner because Umami + CF Web Analytics are cookie-free by design | PASSED (codebase + source-side gate) — needs human (CF dashboard toggle + cookie audit) | Source-side: Umami is cookie-free by vendor contract (no cookies set; no `data-do-not-track` flag enabling cookie set; no consent banner code anywhere — `grep -r "consent" src/ --include="*.astro" --include="*.ts"` returns 0 user-facing consent UI). CF Web Analytics is a **dashboard-only operational toggle** per Plan 01 D-04 (no source code needed for the happy path); Plan 05 SUMMARY captures this as a "deferred-to-pre-deploy" item with §1 + §5 of this scaffold as the durable record. The source-side gate (PROD-only Umami injection + zero cookies) holds. Live verification requires §1 + §5 + §6 human checks. |

**Codebase score: 4/4 verified.** Status reflects that all source-side artifacts are present, wired, and substantive; pre-deploy operational items + production-side dashboard verification remain Jack's responsibility per §§1, 4–9 below.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/layouts/BaseLayout.astro` | PROD-gated Umami `<script>` + analytics.ts/scroll-depth.ts body imports | VERIFIED | `is:inline defer src="https://cloud.umami.is/script.js"` (line 94); `import.meta.env.PROD &&` gate (line 93); `data-domains="jackcutrara.com"` (line 94); `WEBSITE_ID = "32f8fdf4-1f21-4895-9e4c-938285c08240"` (line 47, real UUID committed in 84549f9, placeholder grep returns 0); `<script>import "../scripts/analytics.ts"; import "../scripts/scroll-depth.ts";</script>` (lines 118-121) |
| `src/scripts/analytics.ts` | chat:analytics forwarder + classifyOutbound + handleChatAnalytics + resume-download dedup | VERIFIED | 147 LOC; exports `classifyOutbound` + `handleChatAnalytics`; `chat:analytics` listener at line 94; passive click listener at line 102; `/jack-cutrara-resume.pdf` early-return at line 117; D-12 mailto literal at line 31; D-12 query/fragment strip via `${hostname}${pathname}` at lines 54/59/72; module-level `analyticsInitialized` guard; bootstrap trio (astro:page-load + readyState + DOMContentLoaded) at lines 140-147 |
| `src/scripts/scroll-depth.ts` | IntersectionObserver + sentinel-presence gate + one-shot dedup | VERIFIED | 50 LOC; `new IntersectionObserver` at line 47; `observer.unobserve(entry.target)` D-08 one-shot at line 34; sentinel-presence DOM gate at line 42 (`querySelectorAll('.scroll-sentinel').length === 0` → return — D-05 scope to `/projects/[id]` only); `scrollDepthInitialized` module-level guard; bootstrap trio at lines 63-69 |
| `src/scripts/chat.ts` | SSE truncated-frame parse guard (additive 8 lines) | VERIFIED | Lines 195-202 strict-equality `parsed.truncated === true` → `trackChatEvent("chat_truncated")` → `continue` (L7); `streamChat` exported (line 140) for test seam; D-15 server byte-identical preserved |
| `src/pages/projects/[id].astro` | 4 sentinel `<div>`s + CSS positioning | VERIFIED | 4 `<div class="scroll-sentinel" data-percent="N" aria-hidden="true">` at lines 84-87; `article { position: relative }` + `.scroll-sentinel { position: absolute; height: 1px; pointer-events: none }` at lines 95-108; per-percent `top: 25/50/75/100%` selectors at lines 105-108 |
| `src/pages/api/chat.ts` | BYTE-IDENTICAL from phase start (D-15 hard gate) | VERIFIED | `git diff 6018021 HEAD -- src/pages/api/chat.ts \| wc -l` = 0 (verified at HEAD = 47092d3 inclusive of all 5 plans + UUID swap + REVIEW commit). D-15 hard gate held phase-wide. |
| `tests/build/umami-tag-present.test.ts` | 7 source-text assertions on Umami tag shape | VERIFIED | File present; per Plan 01 SUMMARY 7/7 GREEN |
| `tests/client/analytics.test.ts` | 15 jsdom unit tests (forwarder + classifier + resume + bubble-up) | VERIFIED | File present; per Plan 02 SUMMARY 15/15 GREEN |
| `tests/client/scroll-depth.test.ts` | 8 jsdom unit tests (4 fires + unobserve + slug + L10 + non-fire) | VERIFIED | File present; per Plan 03 SUMMARY 8/8 GREEN |
| `tests/client/sse-truncation.test.ts` | 4 jsdom unit tests (dispatch + L7 + drain + negative) | VERIFIED | File present; per Plan 04 SUMMARY 4/4 GREEN |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `BaseLayout.astro` | `cloud.umami.is/script.js` | `<script is:inline defer src=...>` PROD-gated | WIRED | Line 94 emits the tag verbatim into HTML; `import.meta.env.PROD` static-replaces in dev/preview to literally absent the tag (D-01 belt-and-suspenders) |
| `BaseLayout.astro` | `analytics.ts` | `<script>import "../scripts/analytics.ts"</script>` | WIRED | Line 119; bundled into every prerendered route's `<script type="module">` per Plan 02 SUMMARY |
| `BaseLayout.astro` | `scroll-depth.ts` | `<script>import "../scripts/scroll-depth.ts"</script>` | WIRED | Line 120; same bundle as analytics.ts (single processed `<script>` block) |
| `chat.ts` `trackChatEvent` | `analytics.ts` `handleChatAnalytics` | `chat:analytics` CustomEvent dispatched at chat.ts:380 → `document.addEventListener("chat:analytics", ...)` at analytics.ts:94 | WIRED | D-11 forwarder enumerates ZERO action names; reads `detail.action` and forwards to `window.umami?.track(detail.action, payload)` verbatim. 5th action `chat_truncated` (Plan 04) rides this transparently with no analytics.ts edit |
| `analytics.ts` outbound listener | `window.umami.track` | passive document `click` listener → `classifyOutbound(href)` → `umami.track("outbound_click", classification)` | WIRED | Lines 102-131; closest('a') captures bubbled clicks on anchor children; resume early-return at line 117 prevents double-fire (D-09); same-origin non-pdf returns null (no event) |
| `scroll-depth.ts` observer | `window.umami.track` | IntersectionObserver callback → `handleScrollEntry(entry, observer)` → `umami.track("scroll_depth", {percent, slug})` → `observer.unobserve(entry.target)` | WIRED | Lines 24-35; one-shot per page-view; reloads refire (matches GA4 semantics); slug extracted from `location.pathname.split("/").pop()` |
| `[id].astro` sentinels | `scroll-depth.ts` observer | DOM `.scroll-sentinel` elements observed via `querySelectorAll('.scroll-sentinel')` then `observer.observe(el)` | WIRED | Sentinels present in `dist/client/projects/seatwatch/index.html` (10 `scroll-sentinel` occurrences via `grep -o`); absent from `dist/client/index.html` markup (the 1 occurrence found is the bundled JS module string — sentinel DOM elements don't exist on non-project routes, so `sentinels.length === 0` short-circuits init) |
| `BaseLayout.astro` `WEBSITE_ID` const | Umami `data-website-id` attribute | JSX-expression interpolation `data-website-id={WEBSITE_ID}` | WIRED | Single source of truth at line 47; flows into every prerendered page's HTML via the JSX expression; verified: `grep -c "32f8fdf4-..." dist/client/index.html = 1`; `grep -c "TODO_PHASE_15_UMAMI_ID" dist/client/index.html = 0` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| Umami `<script>` tag | `window.umami` global | External script `cloud.umami.is/script.js` (vendor-loaded) | Vendor-controlled — only resolves in PROD per `import.meta.env.PROD` gate; L10 load-race mitigated by optional-chaining at all 4 `window.umami?.track(...)` callsites | FLOWING (PROD only) — VERIFIED via gate + tests |
| `analytics.ts` `handleChatAnalytics(detail)` | `detail.action`, `detail.label` | `chat:analytics` CustomEvent dispatched by `chat.ts:trackChatEvent` (Phase 7 contract) | Real event payloads when user opens chat, sends a message, clicks a chip, encounters error, or hits truncated frame (5 actions) | FLOWING — VERIFIED |
| `analytics.ts` outbound click listener | `event.target.closest('a').href` | DOM click events from real anchor clicks | Real anchor hrefs from header nav (GitHub, LinkedIn, Email, Resume), footer links, contact page links | FLOWING — VERIFIED |
| `scroll-depth.ts` `handleScrollEntry` | `entry.target.getAttribute("data-percent")`, `location.pathname` | IntersectionObserver entries when sentinel divs enter viewport | Real percent values (25/50/75/100) + real project slug from URL | FLOWING — VERIFIED |
| `chat.ts` SSE truncation guard | `parsed.truncated` from `JSON.parse(data)` | Real SSE diagnostic frame `data: {"truncated":true}\n\n` emitted by `api/chat.ts:128-134` (Phase 14-07) when Anthropic returns `stop_reason: "max_tokens"` | Server emits the frame on real truncation events; client dispatches `chat_truncated` CustomEvent | FLOWING — VERIFIED |

No HOLLOW or DISCONNECTED artifacts. All wiring carries real data through to `window.umami.track(...)` in production builds.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Umami tag emits to PROD HTML | `grep -c "cloud.umami.is" dist/client/index.html` | 1 | PASS |
| Real UUID present in PROD HTML (not placeholder) | `grep -c "32f8fdf4-1f21-4895-9e4c-938285c08240" dist/client/index.html` | 1 | PASS |
| No placeholder leakage to PROD HTML | `grep -c "TODO_PHASE_15_UMAMI_ID" dist/client/index.html` | 0 | PASS |
| Sentinels present on project detail PROD HTML | `grep -o "scroll-sentinel" dist/client/projects/seatwatch/index.html \| wc -l` | 10 (4 markup `class=` + 1 base CSS selector + 4 `[data-percent="N"]` selectors + 1 incidental) | PASS |
| Sentinels NOT in project-page markup of non-project routes | `grep -o "scroll-sentinel" dist/client/index.html \| wc -l` | 1 (bundled JS module's selector string only — DOM markup count = 0; observer's `sentinels.length === 0` gate skips init) | PASS |
| analytics.ts bundled into project pages | `grep -o "chat:analytics" dist/client/projects/seatwatch/index.html \| wc -l` | 1 | PASS |
| D-15 server byte-identical phase-wide | `git diff 6018021 HEAD -- src/pages/api/chat.ts \| wc -l` | 0 | PASS |
| Tests passing | `pnpm test` (per Plans 04 + 05 SUMMARY) | 262/262 GREEN; 31 files | PASS (per SUMMARY; not re-run by verifier — recently re-confirmed 2026-04-24T01:01:51Z by Plan 05 continuation) |
| TypeScript clean | `pnpm check` (per Plans 04 + 05 SUMMARY) | 0 errors / 0 warnings / 0 hints (74 files) | PASS (per SUMMARY) |
| Production build clean | `pnpm build` (per Plan 05 SUMMARY commit 84549f9) | clean end-to-end; 11 prerendered routes | PASS (per SUMMARY) |

All automated checks PASS.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ANAL-01 | 15-01 | Umami Cloud integrated via `<script>` in BaseLayout, env-gated to production hostname only | SATISFIED | `BaseLayout.astro:93-95` PROD-gated tag + real UUID at line 47 (commit 84549f9); 7 source-text tests GREEN |
| ANAL-02 | 15-01 | Cloudflare Web Analytics enabled as secondary for Core Web Vitals | NEEDS HUMAN | Operational dashboard toggle (no source code change). Captured in §1 + §5 of this scaffold as Jack's pre-deploy operational item per Plan 01 D-04. Source-side gate (PROD-only Umami + zero cookies) verified — the toggle itself happens in the Cloudflare Pages dashboard. **Treated as deferred-to-pre-deploy per acknowledged operational pattern; not a missing implementation.** |
| ANAL-03 | 15-02 | analytics.ts forwards chat:analytics CustomEvent (content-free per Phase 7 D-36) to Umami | SATISFIED | `analytics.ts:82-85` handleChatAnalytics drops timestamp, forwards action + optional label; D-15 server byte-identical preserved; D-26 client-only regression battery 6/6 PASS |
| ANAL-04 | 15-02 | Delegated outbound-link tracking — clicks on `a[href^="http"]`, `mailto:`, `.pdf` emit Umami events | SATISFIED | `analytics.ts:102-131` passive document click listener + `classifyOutbound` returns {github, linkedin, email, external, pdf}; D-12 mailto literal + query/fragment strip locked by tests #8 + #10 |
| ANAL-05 | 15-02, 15-03, 15-04 | Recruiter-engagement events: resume download, chat widget open, outbound social, project scroll depth | SATISFIED | All 4 emit-paths shipped: resume_download (15-02 line 118), chat_open (Phase 7 dispatcher → 15-02 forwarder), outbound_click (15-02 line 128), scroll_depth (15-03 line 32). chat_truncated 5th chat:analytics action wired in 15-04. Production dashboard event presence requires §4 human check. |
| ANAL-06 | 15-01 | No cookie consent banner required (Umami + CF Web Analytics are cookie-free by design) | SATISFIED (codebase) — needs human (cookie audit) | Source-side: zero consent-banner UI in repo; Umami + CF Web Analytics cookie-free by vendor contract. Production cookie audit (§6) requires Jack's DevTools check. |

**Coverage:** 6/6 ANAL requirements accounted for. ANAL-01, ANAL-03, ANAL-04, ANAL-05 SATISFIED at the codebase level. ANAL-02 NEEDS HUMAN (dashboard toggle — pre-deploy operational item). ANAL-06 SATISFIED at the source-side gate; production cookie audit pending Jack.

### Anti-Patterns Found

Per the 15-REVIEW.md report (status: issues_found, recommendation: ship), the following findings exist on the Phase 15 surface. None are blockers for goal achievement; all reproduced here for full audit.

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `analytics.ts:140-147` (and `scroll-depth.ts:63-70`, `chat.ts:870-877`) | 8 | Bootstrap listener registers without dedup; long sessions could accumulate document-level `astro:page-load` listeners across view-transition lifecycle | Warning (WR-01) | Slow listener-array growth on long sessions; no observable double-count (init-body guard prevents duplicate behavior). Hygiene fix recommended pre-merge per REVIEW. Does NOT block goal achievement. |
| `analytics.ts:100-131` vs `scroll-depth.ts:39-43` | n/a | Site-wide analytics listener vs route-scoped scroll-depth — comments don't acknowledge asymmetry | Info (IF-01) | Documentation drift only; both are correct by design (outbound clicks happen on every route; scroll-depth is /projects/[id]-only by D-05). |
| `chat.ts:838` (pre-existing, not Phase 15 scope) | 1 | `messageCount === 15` strict equality may skip nudge after localStorage replay | Info (IF-02) | Pre-existing Phase 7 logic; flagged because chat.ts is in REVIEW list. Not a Phase 15 regression. |
| `tests/client/scroll-depth.test.ts:7-8, 21-23, 32-34` | n/a | `latestObserverCallback` captured but never driven — dead-code-ish scaffolding | Info (IF-03) | Test plumbing for a future test that doesn't exist; ~10 LOC; doesn't affect runtime or current test correctness. |

**Verdict: 0 Critical, 1 Warning (hygiene), 3 Info. None block goal achievement.** Recommend addressing WR-01 in a follow-up hygiene PR (3-file, 5-min change) but not gating Phase 15 close-out on it.

### Human Verification Required

Automated codebase verification confirms all 4 success-criterion truths PASS at the source level. The following items require browser/dashboard/production access that Claude cannot perform — Jack executes these as part of pre-deploy + post-deploy operations, evidenced by checking off §§1, 4–9 below.

#### 1. Pre-deploy: Cloudflare Web Analytics dashboard toggle (ANAL-02)

**Test:** Open Cloudflare Dashboard → Workers & Pages → portfolio → Metrics → Web Analytics → Enable.
**Expected:** Toggle is enabled; dashboard shows "Enabled" state; screenshot captured for §5.3.
**Why human:** Requires Cloudflare Pages dashboard credentials Claude does not have; the toggle has no codebase artifact (lives in CF control plane).

#### 2. Post-deploy: Umami dashboard event presence (ANAL-01 + ANAL-05 end-to-end)

**Test:** Per §4 of this scaffold — execute the 9-action sequence on production (`https://jackcutrara.com/`) and confirm Umami dashboard shows ≥1 of each event name within ~60-120s. Includes the negative email-leak check (D-12) and the metadata audit checklist.
**Expected:** All 8 event names appear: chat_open, chip_click, message_sent, chat_truncated, outbound_click (×3 — github/linkedin/email), resume_download, scroll_depth (×4 — 25/50/75/100). Metadata follows D-09/D-10/D-12 contract: `outbound_click.email.href === "mailto"` (never the email address); query/fragment never appears in `outbound_click.href`; scroll_depth percent ∈ {25, 50, 75, 100} only.
**Why human:** Requires a real browser session against the production deploy + Umami Cloud account credentials; cannot be simulated programmatically without breaking the production analytics pipeline.

#### 3. Post-deploy: Cloudflare Web Analytics beacon presence (ANAL-02 happy path)

**Test:** Per §5.1 of this scaffold — `curl -s https://jackcutrara.com/ | grep -c 'static.cloudflareinsights.com'` returns ≥1.
**Expected:** ≥1 (auto-inject path holds). If 0 → activate fallback per §5.2 (explicit `<script>` tag with same PROD gate).
**Why human:** Requires production deploy to be live; verifies CF auto-inject regression-known behavior (RESEARCH §4.5 MEDIUM confidence).

#### 4. Post-deploy: ANAL-06 cookie audit

**Test:** Per §6 of this scaffold — load `https://jackcutrara.com/` in clean browser profile, DevTools → Application → Cookies → confirm only `__cf_bm` (operational, bot-management) is set; no analytics cookies; no consent banner appears.
**Expected:** Zero analytics cookies (umami.is, cloudflareinsights.com, jackcutrara.com first-party analytics all empty); no consent banner.
**Why human:** Requires browser DevTools session against production; vendor-contract verification of cookie-free behavior.

#### 5. Post-deploy: D-01 preview-subdomain silence

**Test:** Per §7 of this scaffold — `curl -s https://<preview>.portfolio-5wl.pages.dev/ | grep -c 'cloud.umami.is'` returns 0.
**Expected:** 0 (PROD gate's belt-and-suspenders works; preview deploy's HTML has no Umami tag).
**Why human:** Requires a Phase 15 preview deploy URL Cloudflare generates per branch.

#### 6. Post-deploy: Lighthouse CI gate

**Test:** Per §9 of this scaffold — Lighthouse against `/` + `/projects/seatwatch` on production. Expected: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100 / TBT ≤150ms / CLS ≤0.01.
**Expected:** All thresholds hold; zero regressions from Phase 14 baseline. Umami defer-loaded 2KB script is well inside budget; sentinel divs are zero-cost (empty DOM, aria-hidden).
**Why human:** Requires production URL with the UUID-bearing build deployed and CF Web Analytics enabled; Lighthouse runs against live URLs not local dev.

### Goal Achievement Determination

The Phase 15 goal — "Jack can observe recruiter engagement on the live site … via a Umami dashboard that fires only on production, uses zero cookies, and requires no consent banner" — is **codebase-complete and awaiting pre-deploy + post-deploy human verification**.

- **Codebase artifacts:** all present, substantive, wired, and carrying real data (4/4 must-haves, all artifacts VERIFIED, all key links WIRED, all data-flow traces FLOWING)
- **D-15 server byte-identical hard gate:** held phase-wide (`git diff 6018021 HEAD -- src/pages/api/chat.ts | wc -l = 0`)
- **D-26 chat regression battery:** PASS for client-only surface (per Plan 04 SUMMARY: 6 PASS / 3 SKIP-by-D-15 / 0 FAIL)
- **Test suite:** 262/262 GREEN per Plans 04 + 05 SUMMARYs (added 7 + 15 + 8 + 4 = 34 tests in Phase 15)
- **Code review:** 0 Critical, 1 Warning (hygiene), 3 Info — recommendation: ship
- **Real UUID committed:** `32f8fdf4-1f21-4895-9e4c-938285c08240` at `BaseLayout.astro:47` (commit 84549f9); placeholder fully replaced; UUID present in every prerendered page
- **Operational items remaining for Jack:** CF Web Analytics dashboard toggle (ANAL-02 — non-codebase, captured in §1 + §5), production Umami dashboard event-presence verification (§4), production cookie audit (§6), preview-silence check (§7), Lighthouse CI run (§9)

**Status: human_needed.** All automated/codebase checks pass; the goal is fully shippable from a code perspective. The phase cannot be marked `passed` until Jack executes the §1 pre-deploy items and §§4–9 post-deploy verifications and flips the corresponding `[ ]` checkboxes to `[x]`.

---

## 1. Pre-Deploy Checklist (Jack's Operational Tasks)

These tasks gate production deploy. Must be complete before merging `phase-15-*` → `main`.

- [x] **Create Umami Cloud website entry** for `jackcutrara.com`. Capture the `data-website-id` UUID.
  - Dashboard: https://cloud.umami.is/ → Websites → Add website → Name: "Jack Cutrara Portfolio", Domain: "jackcutrara.com"
  - After creation: copy the UUID from the site's tracking snippet.
  - **Status: complete** — UUID `32f8fdf4-1f21-4895-9e4c-938285c08240` provided by Jack via 15-05 Task 3 checkpoint:human-action.

- [x] **Replace `TODO_PHASE_15_UMAMI_ID` placeholder** in `src/layouts/BaseLayout.astro:47` (the `WEBSITE_ID` const in frontmatter) with the actual UUID from Umami dashboard. Commit with message `chore(15): commit Umami website UUID`.
  - **Status: complete** — orchestrator-applied at commit 84549f9; verified by `grep -c "TODO_PHASE_15_UMAMI_ID" src/layouts/BaseLayout.astro = 0` and `grep -c "32f8fdf4-..." src/layouts/BaseLayout.astro = 1`.

- [ ] **Enable Cloudflare Web Analytics** on the portfolio Pages project.
  - Dashboard: https://dash.cloudflare.com → Workers & Pages → portfolio → Metrics → Web Analytics → Enable
  - Capture screenshot of the "Enabled" state. Attach below §5.

- [ ] **Verify production deploy** of the Phase 15 branch. Expect: latest commit is the "commit Umami website UUID" commit (above).

---

## 2. Automated Test Evidence

All tests must be GREEN before production deploy.

| Plan | Test File | Tests | Status | Command |
|------|-----------|-------|--------|---------|
| 15-01 | `tests/build/umami-tag-present.test.ts` | 7 | [x] GREEN | `pnpm test -- tests/build/umami-tag-present.test.ts` |
| 15-02 | `tests/client/analytics.test.ts` | 15 | [x] GREEN | `pnpm test -- tests/client/analytics.test.ts` |
| 15-03 | `tests/client/scroll-depth.test.ts` | 8 | [x] GREEN | `pnpm test -- tests/client/scroll-depth.test.ts` |
| 15-04 | `tests/client/sse-truncation.test.ts` | 4 | [x] GREEN | `pnpm test -- tests/client/sse-truncation.test.ts` |
| Full suite | all | 262 | [x] GREEN | `pnpm test` (262/262 per Plans 04 + 05 SUMMARY; re-confirmed 2026-04-24T01:01:51Z) |
| Build | — | — | [x] PASS | `pnpm build` (zero warnings; 11 prerendered routes per Plan 05 SUMMARY commit 84549f9) |
| TypeScript | — | — | [x] PASS | `pnpm check` (0/0/0; 74 files per Plans 04 + 05 SUMMARY) |

**Total new tests added in Phase 15:** 34 (7 + 15 + 8 + 4). Phase 14 baseline = 228; full-suite count = 262 tests GREEN (matches Plan 15-04 close-out 262/262).

---

## 3. D-26 Chat Regression Gate — Client-Only Subset

Per D-15: server `src/pages/api/chat.ts` is byte-identical (`git diff 6018021 HEAD -- src/pages/api/chat.ts` returns 0 across the entire Phase 15 commit range, verified by verifier 2026-04-23). Items 2, 3, 4 (server-surface) are SKIP; items 1, 5, 6, 7, 8, 9 (client-surface) re-run.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | XSS sanitization (DOMPurify strict, markdown render) | [x] PASS | `tests/client/markdown.test.ts` GREEN per Plan 04 SUMMARY D-26 audit |
| 2 | CORS exact-origin | [x] SKIP (D-15) | Server byte-identical. `git diff 6018021 HEAD -- src/pages/api/chat.ts` empty |
| 3 | Rate limit (5/60s CF binding) | [x] SKIP (D-15) | Server byte-identical (same pre-existing binding gap from Phase 14-06 Task 3 — still tracked at `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`, unchanged by Phase 15) |
| 4 | 30s AbortController timeout | [x] SKIP (D-15) | Server byte-identical |
| 5 | Focus trap re-query | [x] PASS | `tests/client/focus-visible.test.ts` GREEN per Plan 04 SUMMARY D-26 audit |
| 6 | localStorage persistence (50-msg / 24h TTL) | [x] PASS | `tests/client/chat-copy-button.test.ts` (covers idempotent replay) GREEN per Plan 04 SUMMARY |
| 7 | SSE streaming (line-by-line delta) + truncated frame AUGMENTATION | [x] PASS | `tests/client/sse-truncation.test.ts` 4/4 GREEN. Plan 04's additive `if (parsed.truncated === true) continue` guard does not alter delta handling for non-truncated frames (sse-truncation.test.ts test #4 locks this) |
| 8 | Markdown rendering (DOMPurify strict) | [x] PASS | `tests/client/markdown.test.ts` GREEN per Plan 04 SUMMARY |
| 9 | Copy button parity (live vs localStorage replay) | [x] PASS | `tests/client/chat-copy-button.test.ts` GREEN per Plan 04 SUMMARY |

**Gate result:** all applicable items (6/6) PASS; 3/9 SKIP per D-15; 0/9 FAIL → **D-26 client-only gate PASSES**.

---

## 4. Umami Dashboard Event-Presence (ANAL-01, ANAL-05 end-to-end)

Post-deploy verification. Wait ~60-120 seconds after each action for events to reach Umami ingest.

**Prerequisite:** Umami UUID committed (§1 — done), production deploy completed, `https://jackcutrara.com/` responds 200.

Jack performs the following sequence against `https://jackcutrara.com/`:

| # | Action | Expected Umami Event | Expected Metadata |
|---|--------|----------------------|-------------------|
| 1 | Click the chat bubble to open the chat panel | `chat_open` | `{}` (empty) |
| 2 | Click one of the starter chips | `chip_click` | `{label: "<chip text>"}` |
| 3 | Type a short message and submit | `message_sent` | `{}` |
| 4 | Wait for a response that hits max_tokens (e.g., ask for a very long enumeration) | `chat_truncated` | `{}` — 5th chat action |
| 5 | Click the GitHub footer link | `outbound_click` | `{type: "github", href: "github.com/jackc625"}` |
| 6 | Click the LinkedIn footer link | `outbound_click` | `{type: "linkedin", href: "linkedin.com/in/jackcutrara"}` |
| 7 | Click the mailto: link in the footer | `outbound_click` | `{type: "email", href: "mailto"}` (NOT the email address — D-12) |
| 8 | Click the RESUME link in the header | `resume_download` | `{source: "<current pathname>"}` (NOT outbound_click — D-09) |
| 9 | Navigate to `/projects/seatwatch`, scroll to bottom | `scroll_depth` × 4 | `{percent: 25/50/75/100, slug: "seatwatch"}` — 4 events per page view |

**Screenshot checklist:**

- [ ] Umami dashboard → Events → filter by last 24 hours. Shows ≥1 of each event name above.
- [ ] Umami dashboard → Events → `outbound_click` → inspect metadata. Confirm: `type` values ∈ {github, linkedin, email, external, pdf}; `href` never contains `?` `#` or `@` (D-12 content-free discipline).
- [ ] Umami dashboard → Events → `resume_download` → inspect metadata. Confirm: `source` is a pathname string (no query, no fragment).
- [ ] Umami dashboard → Events → `scroll_depth` → confirm percent values ∈ {25, 50, 75, 100} only; slug matches one of the 6 project slugs.

**Negative check — no email leakage (T-15-04b):**
- [ ] Umami dashboard → Events → `outbound_click` → filter by `type=email` → inspect `href` values. Confirm: the ONLY value ever stored is the literal string `"mailto"`. Any appearance of `jackcutrara@gmail.com` or any `@` character is a D-12 regression.

---

## 5. Cloudflare Web Analytics Verification (ANAL-02)

Post-deploy verification. Happy path assumes CF auto-inject (D-04); fallback path documented.

### 5.1 Happy path check

```bash
curl -s https://jackcutrara.com/ | grep -c 'static.cloudflareinsights.com'
```
Expected output: `1` (or higher).

- [ ] Command returns `>=1`

If the above returns `0`, proceed to **5.2 Fallback path**.

### 5.2 Fallback path (explicit `<script>` tag)

CONTEXT.md Claude's Discretion pre-approved this fallback. Activation steps:

1. Open `src/layouts/BaseLayout.astro`.
2. Add a second `{import.meta.env.PROD && <script>}` block immediately after the Umami tag (before `<Font>` preloads):

```astro
{import.meta.env.PROD && (
  <script
    is:inline
    defer
    src="https://static.cloudflareinsights.com/beacon.min.js"
    data-cf-beacon={`{"token": "REPLACE_WITH_CF_TOKEN"}`}
  />
)}
```

3. Get the token from CF dashboard → Web Analytics → site details → JavaScript snippet (shown in dashboard UI).
4. Commit + deploy; re-run §5.1 check.

### 5.3 Dashboard verification

- [ ] CF dashboard → Workers & Pages → portfolio → Metrics → Web Analytics → shows pageview + Core Web Vitals (LCP, INP, CLS, TTFB) after 24 hours of production traffic.
- [ ] Screenshot attached.

---

## 6. ANAL-06 Cookie Audit (No Consent Banner Required)

Umami + CF Web Analytics are cookie-free by vendor contract. Prove it on production.

1. Load `https://jackcutrara.com/` in a clean browser profile (no extensions, fresh storage).
2. Open DevTools → Application → Cookies → `jackcutrara.com` (and `cloud.umami.is` + `static.cloudflareinsights.com` if sub-domains appear).
3. Expected cookie set:

| Cookie Name | Source | Acceptable | Rationale |
|-------------|--------|-----------|-----------|
| `__cf_bm` | Cloudflare (operational, bot-management) | [ ] OK | Not analytical — bot/DDoS mitigation. Automatic on CF-proxied sites; users cannot opt out via banner anyway. |
| (any umami.is cookie) | — | [ ] MUST BE EMPTY | Umami Cloud is cookie-free; any cookie here signals a regression or vendor behavior change. |
| (any cloudflareinsights.com cookie) | — | [ ] MUST BE EMPTY | CF Web Analytics is cookie-free by contract. |
| (first-party jackcutrara.com analytics cookie) | — | [ ] MUST BE EMPTY | No first-party analytics cookies are set by this site. |

- [ ] DevTools screenshot attached.
- [ ] Confirmed: no user-consent banner shown on page load.

---

## 7. D-01 Preview-Subdomain Silence Check

Verify preview deploys at `*.portfolio-5wl.pages.dev` do NOT ship the Umami tag.

```bash
# Replace <preview> with the actual preview subdomain of the Phase 15 branch deploy
curl -s https://<preview>.portfolio-5wl.pages.dev/ | grep -c 'cloud.umami.is'
```
Expected output: `0`.

- [ ] Command returns `0` — D-01 belt-and-suspenders holds (`import.meta.env.PROD` static-replaces to `false` in preview builds, tag literally absent from HTML).

---

## 8. Threat Retirement Table

| Threat ID | Category | Status | Evidence |
|-----------|----------|--------|----------|
| T-15-01 | Information Disclosure (chat payload drift) | [x] RETIRED | Plan 02 test #2 + content-free discipline; `handleChatAnalytics` drops timestamp, passes action + label only |
| T-15-02 | Integrity (Umami loading on non-prod) | [x] RETIRED | Plan 01 test #6 asserts `import.meta.env.PROD` gate; §7 preview-subdomain curl awaiting human verification |
| T-15-03 | Tampering (SSE truncated spam) | [x] RETIRED | Plan 04 strict `parsed.truncated === true` equality check; verifier-confirmed `grep -c "parsed.truncated === true" src/scripts/chat.ts = 1` |
| T-15-04 | Information Disclosure (href query/fragment leak) | [x] RETIRED | Plan 02 test #10 asserts token stripping; §4 negative check (no `?` `#` or `@` in outbound_click metadata) awaits human verification |
| T-15-04b | Information Disclosure (mailto: email leak) | [x] RETIRED | Plan 02 test #8 asserts literal "mailto" string; verifier-confirmed `grep -c "jackcutrara@gmail.com" src/scripts/analytics.ts = 0` |
| T-15-05 | Information Disclosure (resume double-count) | [x] RETIRED | Plan 02 test #13 asserts outbound_click NOT called on resume pdf click |
| T-15-06 | Tampering (Umami JS supply-chain) | [x] ACCEPTED | SRI not feasible for auto-updating tracker script (RESEARCH §1.7). Residual risk: free-tier portfolio, no auth/PII surface. Plan 01 acceptance criterion: `grep "integrity=" src/layouts/BaseLayout.astro` returns 0 |
| T-15-07 | Information Disclosure (CF auto-inject silent fail) | [ ] RETIRED or FALLBACK | §5.1 returns >=1 (RETIRED) or §5.2 fallback activated (mitigated) — pending production deploy |
| T-15-08 | Spoofing (fake sentinel injection) | [x] ACCEPTED | Same-origin DOM access threshold; no security boundary |
| T-15-09 | Information Disclosure (slug leaking private routes) | [x] RETIRED | Sentinels only exist on public `/projects/[id]` routes; policy documented above |
| T-15-10 | Denial of Service (observer leak) | [x] RETIRED | `scrollDepthInitialized` init guard + `observer.unobserve` on fire; no `<ClientRouter />` means full-page nav tears down observers |
| T-15-11 | Denial of Service (chat_truncated flood) | [x] ACCEPTED | Same-origin spoof class (Plan 02 T-15-spoof covers) |
| T-15-D15-integrity | Integrity (accidental server edit) | [x] RETIRED | Plan 04 acceptance `git diff 6018021 HEAD -- src/pages/api/chat.ts \| wc -l` returns 0; verifier re-confirmed phase-wide |

**Summary:** 9 RETIRED + 3 ACCEPTED + 1 PENDING-PRODUCTION (T-15-07 awaits §5 verification) → 12 dispositions resolved at codebase level + 1 awaits live-deploy data.

---

## 9. Lighthouse CI Gate (Cross-Phase Constraint)

Run against production `https://jackcutrara.com/` after Umami UUID committed and CF Web Analytics enabled.

| Page | Performance | Accessibility | Best Practices | SEO | TBT | CLS |
|------|-------------|---------------|----------------|-----|-----|-----|
| `/` | [ ] ≥99 | [ ] ≥95 | [ ] 100 | [ ] 100 | [ ] ≤150ms | [ ] ≤0.01 |
| `/projects/seatwatch` | [ ] ≥99 | [ ] ≥95 | [ ] 100 | [ ] 100 | [ ] ≤150ms | [ ] ≤0.01 |

Expected: zero regressions from Phase 14 baseline. Umami defer-loaded 2KB script is well inside budget; sentinel divs are zero-cost (empty DOM, aria-hidden).

- [ ] Lighthouse report HTML attached as evidence.

---

## 10. Sign-off

- [x] All §2 automated tests GREEN
- [x] §3 D-26 client-only gate PASSES (6/6 applicable)
- [ ] §4 Umami dashboard shows all 8 event names end-to-end (24-hour traffic window)
- [ ] §5 CF Web Analytics verified (happy path OR fallback activated)
- [ ] §6 Cookie audit: zero analytics cookies set (only operational `__cf_bm` acceptable)
- [ ] §7 D-01 preview-subdomain silence confirmed
- [x] §8 Threat retirement: 9 RETIRED + 3 ACCEPTED at codebase level; T-15-07 awaits §5 production verification
- [ ] §9 Lighthouse CI holds on both test pages
- [x] §1 Pre-deploy: Umami UUID committed; [ ] CF Web Analytics enabled

**Phase 15 verification status:** codebase-complete (verifier-confirmed 2026-04-23). When Jack flips the remaining `[ ]` boxes to `[x]` (CF dashboard toggle + post-deploy production checks), update frontmatter `status` to `passed`, fill in `verified` ISO date for re-stamp, set `d26_compliant: true`, set `lighthouse_compliant: true`.

---

*Phase: 15-analytics-instrumentation*
*Scaffold authored: 2026-04-23 (Plan 15-05)*
*Verifier-augmented: 2026-04-23 (gsd-verifier)*
*Pending: Jack's pre-deploy CF toggle + post-deploy verification (§§4–9)*
