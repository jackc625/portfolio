---
phase: 15
slug: analytics-instrumentation
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-23
audited: 2026-04-26
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `15-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **DOM env** | jsdom 29.0.1 (per-file via `// @vitest-environment jsdom`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- tests/client/analytics.test.ts tests/client/sse-truncation.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~2s quick / ~15s full |

---

## Sampling Rate

- **After every task commit:** `pnpm test -- tests/client/analytics.test.ts tests/client/sse-truncation.test.ts`
- **After every plan wave:** `pnpm test` (full suite) + `pnpm build` clean + `grep cloud.umami.is dist/client/index.html`
- **Before `/gsd-verify-work`:** Full suite green + Lighthouse CI pair (home + /projects/seatwatch)
- **Max feedback latency:** ~2 seconds per commit, ~15 seconds per wave

---

## Per-Task Verification Map

*Populated by planner — one row per task in `15-*-PLAN.md`. The seam-to-test mapping below is the authoritative reference.*

| Requirement | Validation Seam | Test Type | Automated Command | Wave 0? |
|-------------|-----------------|-----------|-------------------|---------|
| ANAL-01 | Umami tag present in prod build, absent in dev | build-output | `pnpm test -- tests/build/umami-tag-present.test.ts` | ✅ NEW |
| ANAL-02 | CF Web Analytics beacon present in production HTML | manual | `curl -s https://jackcutrara.com/ \| grep cloudflareinsights.com` | manual post-deploy |
| ANAL-03 | `chat:analytics` forwarder dispatches to Umami for all 5 actions (D-11 + D-14) | unit | `pnpm test -- tests/client/analytics.test.ts` | ✅ NEW |
| ANAL-04 | Delegated outbound click emits Umami event with D-10 taxonomy + D-12 href policy | unit | `pnpm test -- tests/client/analytics.test.ts` | ✅ NEW |
| ANAL-05 | Resume dl, chat open, outbound, scroll-depth all fire correctly | unit + manual | `pnpm test -- tests/client/analytics.test.ts tests/client/scroll-depth.test.ts` + 24h Umami dashboard screenshot | ✅ NEW + VERIFICATION.md |
| ANAL-06 | No cookie-consent banner required (zero cookies set by Umami or CF) | manual | DevTools Application → Cookies → assert zero Umami/CF cookies | manual post-deploy |
| D-14 | Server SSE `truncated: true` frame dispatches `chat_truncated` via `chat:analytics` | unit | `pnpm test -- tests/client/sse-truncation.test.ts` | ✅ NEW |
| D-15 | `src/pages/api/chat.ts` byte-identical across Phase 15 | static (phase-scoped) | `git log --oneline --since="2026-04-23" -- src/pages/api/chat.ts` returns empty (verified at audit — zero phase-15 commits to server) | — (git check, phase-scoped) |
| D-09 | `/jack-cutrara-resume.pdf` fires ONLY `resume_download` (not `outbound_click`) | unit | assert `vi.fn()` call counts in `analytics.test.ts` | ✅ NEW |
| D-26 | Client-only regression (XSS, copy, focus, localStorage, SSE, markdown) | unit | `pnpm test` (existing Phase 7 / 12 / 14 test files) | ✓ Exists |

*Status tracking: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — maintained per-task in plan `<verify>` blocks.*

---

## Wave 0 Requirements

- [x] `tests/client/analytics.test.ts` — NEW — covers ANAL-03, ANAL-04, ANAL-05, D-09, D-10, D-11, D-12 (15 tests GREEN)
- [x] `tests/client/sse-truncation.test.ts` — NEW — covers D-14, D-15 (client side) (4 tests GREEN)
- [x] `tests/client/scroll-depth.test.ts` — NEW (Plan 03) — covers D-05, D-06, D-07, D-08, ANAL-05 scroll half (8 tests GREEN)
- [x] `tests/build/umami-tag-present.test.ts` — NEW — covers ANAL-01 build-output assertions (7 tests GREEN)
- [x] `src/scripts/analytics.ts` — NEW (147 LOC) shipped with test seams (classifyOutbound, handleChatAnalytics)
- [x] `src/scripts/scroll-depth.ts` — NEW (50 LOC) IntersectionObserver-based tracker
- [x] `15-VERIFICATION.md` — NEW (240 LOC) — 10 sections, 13 T-15 threats, 8 Umami events, ≥60 empty checkboxes
- [x] `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md` — NEW — D-13 deferred scope capture

**No framework install required** — Vitest + jsdom + native DOM APIs cover every seam. `IntersectionObserver` must be stubbed per test file (jsdom 29 does not ship one).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Umami dashboard receives events for `jackcutrara.com` only | ANAL-01, ANAL-05 | Only verifiable post-deploy once traffic flows | After deploy: trigger resume download, chat open, outbound click, scroll 100% on one project page. Wait 60s. Screenshot Umami dashboard showing 4 events with correct metadata. Attach to `15-VERIFICATION.md`. |
| CF Web Analytics auto-injected on custom domain | ANAL-02 | Depends on CF Pages proxy behavior for the specific domain config | After deploy: `curl -s https://jackcutrara.com/ \| grep -c 'static.cloudflareinsights.com'` must return `1`. If `0`, fall back to explicit `<script>` in BaseLayout (CONTEXT.md Claude's Discretion). |
| Zero cookies set by analytics (no banner required) | ANAL-06 | Browser-session state not inspectable in unit tests | Load `https://jackcutrara.com/`, open DevTools → Application → Cookies, screenshot showing empty cookie list (or only Cloudflare's `__cf_bm` bot-management cookie, which is operational not analytical). |
| Preview deploys silent | D-01 | Requires actual deploy to `*.portfolio-5wl.pages.dev` | `curl -s https://<preview>.portfolio-5wl.pages.dev/ \| grep -c cloud.umami.is` must return `0`. Confirmed via D-01 belt-and-suspenders: `import.meta.env.PROD` static-replaces to `false` in preview builds. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all NEW test files listed above
- [x] No watch-mode flags in plan tasks (CI-compatible commands only)
- [x] Feedback latency < 15s per wave
- [x] `nyquist_compliant: true` set in frontmatter after planner completes mapping

**Approval:** approved 2026-04-23 via /gsd-plan-phase verification

---

## Validation Audit 2026-04-26

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |
| Missing tests | 0 |

**Resolution summary:**

| Gap | Type | Fix |
|-----|------|-----|
| ANAL-05 row's automated command listed only `analytics.test.ts`; scroll-depth seam is exercised by `tests/client/scroll-depth.test.ts` (Plan 03 deliverable, not surfaced in original Per-Task Map) | doc-only (test exists, row stale) | Updated row's command to include `tests/client/scroll-depth.test.ts`; added Wave 0 row for scroll-depth.test.ts |
| D-15 row's `git diff HEAD~ -- src/pages/api/chat.ts` rotted past Plan 04's commit window; meaningless on main now that Plan 05 + post-execution commits have landed | stale automated command | Re-anchored to phase-scoped `git log --oneline --since="2026-04-23" -- src/pages/api/chat.ts` (verified empty at audit — zero phase-15 commits to server) |

**Phase status post-audit:**

- Full suite: **262/262 GREEN** in 6.3s
- All 8 Wave 0 deliverables exist on disk; checkboxes flipped
- frontmatter `wave_0_complete` corrected `false` → `true`
- frontmatter `audited: 2026-04-26` added
- All 10 requirements have automated coverage or documented manual-only path
- `nyquist_compliant: true` re-confirmed
