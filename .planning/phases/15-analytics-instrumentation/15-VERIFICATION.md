---
phase: 15
slug: analytics-instrumentation
status: scaffold (populated during /gsd-verify-work)
created: 2026-04-23
verified: null
d26_compliant: null
lighthouse_compliant: null
---

# Phase 15 — Verification

Evidence capture for the Phase 15 Analytics Instrumentation milestone. Scaffold authored during Plan 15-05. Populated during `/gsd-verify-work` + post-deploy Jack verification.

Phase 15 is a **client-only + zero-runtime-dep phase** by design (D-15). Server (`src/pages/api/chat.ts`) is byte-identical; D-26 gate collapses to the client-only subset per RESEARCH §9.2.

---

## 1. Pre-Deploy Checklist (Jack's Operational Tasks)

These tasks gate production deploy. Must be complete before merging `phase-15-*` → `main`.

- [ ] **Create Umami Cloud website entry** for `jackcutrara.com`. Capture the `data-website-id` UUID.
  - Dashboard: https://cloud.umami.is/ → Websites → Add website → Name: "Jack Cutrara Portfolio", Domain: "jackcutrara.com"
  - After creation: copy the UUID from the site's tracking snippet.

- [ ] **Replace `TODO_PHASE_15_UMAMI_ID` placeholder** in `src/layouts/BaseLayout.astro:47` (the `WEBSITE_ID` const in frontmatter) with the actual UUID from Umami dashboard. Commit with message `chore(15): commit Umami website UUID`.

- [ ] **Enable Cloudflare Web Analytics** on the portfolio Pages project.
  - Dashboard: https://dash.cloudflare.com → Workers & Pages → portfolio → Metrics → Web Analytics → Enable
  - Capture screenshot of the "Enabled" state. Attach below §5.

- [ ] **Verify production deploy** of the Phase 15 branch. Expect: latest commit is the "commit Umami website UUID" commit (above).

---

## 2. Automated Test Evidence

All tests must be GREEN before production deploy.

| Plan | Test File | Tests | Status | Command |
|------|-----------|-------|--------|---------|
| 15-01 | `tests/build/umami-tag-present.test.ts` | 7 | [ ] GREEN | `pnpm test -- tests/build/umami-tag-present.test.ts` |
| 15-02 | `tests/client/analytics.test.ts` | 15 | [ ] GREEN | `pnpm test -- tests/client/analytics.test.ts` |
| 15-03 | `tests/client/scroll-depth.test.ts` | 8 | [ ] GREEN | `pnpm test -- tests/client/scroll-depth.test.ts` |
| 15-04 | `tests/client/sse-truncation.test.ts` | 4 | [ ] GREEN | `pnpm test -- tests/client/sse-truncation.test.ts` |
| Full suite | all | TBD | [ ] GREEN | `pnpm test` |
| Build | — | — | [ ] PASS | `pnpm build` (zero warnings) |
| TypeScript | — | — | [ ] PASS | `pnpm check` (zero errors) |

**Total new tests added in Phase 15:** 34 (7 + 15 + 8 + 4). Phase 14 baseline = 228; expected full-suite count = 262 tests GREEN (matches Plan 15-04 close-out 262/262).

---

## 3. D-26 Chat Regression Gate — Client-Only Subset

Per D-15: server `src/pages/api/chat.ts` is byte-identical (`git diff HEAD~ -- src/pages/api/chat.ts` returns empty across the Phase 15 commit range). Items 2, 3, 4 (server-surface) are SKIP; items 1, 5, 6, 7, 8, 9 (client-surface) re-run.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | XSS sanitization (DOMPurify strict, markdown render) | [ ] PASS | `pnpm test -- tests/client/markdown.test.ts` exits 0 |
| 2 | CORS exact-origin | [ ] SKIP (D-15) | Server byte-identical. `git diff HEAD~ -- src/pages/api/chat.ts` empty |
| 3 | Rate limit (5/60s CF binding) | [ ] SKIP (D-15) | Server byte-identical (same pre-existing binding gap from Phase 14-06 Task 3 — still tracked at `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`, unchanged by Phase 15) |
| 4 | 30s AbortController timeout | [ ] SKIP (D-15) | Server byte-identical |
| 5 | Focus trap re-query | [ ] PASS | `pnpm test -- tests/client/focus-visible.test.ts` exits 0 |
| 6 | localStorage persistence (50-msg / 24h TTL) | [ ] PASS | `pnpm test -- tests/client/chat-copy-button.test.ts` (covers idempotent replay) exits 0 |
| 7 | SSE streaming (line-by-line delta) + truncated frame AUGMENTATION | [ ] PASS | `pnpm test -- tests/client/sse-truncation.test.ts tests/api/chat.test.ts` exits 0. Plan 04's additive `if (parsed.truncated === true) continue` guard does not alter delta handling for non-truncated frames (test in sse-truncation.test.ts #4 locks this). |
| 8 | Markdown rendering (DOMPurify strict) | [ ] PASS | `pnpm test -- tests/client/markdown.test.ts` exits 0 |
| 9 | Copy button parity (live vs localStorage replay) | [ ] PASS | `pnpm test -- tests/client/chat-copy-button.test.ts` exits 0 |

**Gate result:** all applicable items (6/6) PASS; 3/9 SKIP per D-15; 0/9 FAIL → **D-26 client-only gate PASSES**.

---

## 4. Umami Dashboard Event-Presence (ANAL-01, ANAL-05 end-to-end)

Post-deploy verification. Wait ~60-120 seconds after each action for events to reach Umami ingest.

**Prerequisite:** Umami UUID committed (§1), production deploy completed, `https://jackcutrara.com/` responds 200.

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
| T-15-01 | Information Disclosure (chat payload drift) | [ ] RETIRED | Plan 02 test #2 + content-free discipline; `handleChatAnalytics` drops timestamp, passes action + label only |
| T-15-02 | Integrity (Umami loading on non-prod) | [ ] RETIRED | Plan 01 test #6 asserts `import.meta.env.PROD` gate; §7 preview-subdomain curl returns 0 |
| T-15-03 | Tampering (SSE truncated spam) | [ ] RETIRED | Plan 04 strict `parsed.truncated === true` equality check; acceptance `grep` returns 1 |
| T-15-04 | Information Disclosure (href query/fragment leak) | [ ] RETIRED | Plan 02 test #10 asserts token stripping; §4 negative check (no `?` `#` or `@` in outbound_click metadata) |
| T-15-04b | Information Disclosure (mailto: email leak) | [ ] RETIRED | Plan 02 test #8 asserts literal "mailto" string; §4 negative check confirms |
| T-15-05 | Information Disclosure (resume double-count) | [ ] RETIRED | Plan 02 test #13 asserts outbound_click NOT called on resume pdf click |
| T-15-06 | Tampering (Umami JS supply-chain) | [ ] ACCEPTED | SRI not feasible for auto-updating tracker script (RESEARCH §1.7). Residual risk: free-tier portfolio, no auth/PII surface. Plan 01 acceptance criterion: `grep "integrity=" src/layouts/BaseLayout.astro` returns 0 |
| T-15-07 | Information Disclosure (CF auto-inject silent fail) | [ ] RETIRED or FALLBACK | §5.1 returns >=1 (RETIRED) or §5.2 fallback activated (mitigated) |
| T-15-08 | Spoofing (fake sentinel injection) | [ ] ACCEPTED | Same-origin DOM access threshold; no security boundary |
| T-15-09 | Information Disclosure (slug leaking private routes) | [ ] RETIRED | Sentinels only exist on public `/projects/[id]` routes; policy documented above |
| T-15-10 | Denial of Service (observer leak) | [ ] RETIRED | `scrollDepthInitialized` init guard + `observer.unobserve` on fire; no `<ClientRouter />` means full-page nav tears down observers |
| T-15-11 | Denial of Service (chat_truncated flood) | [ ] ACCEPTED | Same-origin spoof class (Plan 02 T-15-spoof covers) |
| T-15-D15-integrity | Integrity (accidental server edit) | [ ] RETIRED | Plan 04 acceptance `git diff HEAD~ -- src/pages/api/chat.ts \| wc -l` returns 0 |

**Summary:** 10 RETIRED + 3 ACCEPTED + 0 OPEN.

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

- [ ] All §2 automated tests GREEN
- [ ] §3 D-26 client-only gate PASSES (6/6 applicable)
- [ ] §4 Umami dashboard shows all 8 event names end-to-end (24-hour traffic window)
- [ ] §5 CF Web Analytics verified (happy path OR fallback activated)
- [ ] §6 Cookie audit: zero analytics cookies set (only operational `__cf_bm` acceptable)
- [ ] §7 D-01 preview-subdomain silence confirmed
- [ ] §8 Threat retirement: 10 RETIRED + 3 ACCEPTED + 0 OPEN
- [ ] §9 Lighthouse CI holds on both test pages
- [ ] §1 Pre-deploy: Umami UUID committed; CF Web Analytics enabled

**Phase 15 verification complete:** fill in verified date + commit SHAs + flip frontmatter `verified`, `d26_compliant`, `lighthouse_compliant` to ISO-8601 / `true`.

---

*Phase: 15-analytics-instrumentation*
*Scaffold authored: 2026-04-23 (Plan 15-05)*
*Populated during: `/gsd-verify-work` + Jack's post-deploy verification*
