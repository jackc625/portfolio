---
phase: 15-analytics-instrumentation
plan: 01
subsystem: infra
tags: [analytics, umami, cloudflare-web-analytics, astro-baselayout, is-inline, prod-gate, tdd, source-text-assertion]

# Dependency graph
requires:
  - phase: 07-chatbot-feature
    provides: "BaseLayout.astro <head> structure + chat:analytics CustomEvent dispatcher that Plan 02's analytics.ts will consume (not touched by Plan 01)"
  - phase: 14-chat-knowledge-upgrade
    provides: "chat-widget-header.test.ts source-text assertion precedent (readFileSync + process.cwd()) that umami-tag-present.test.ts mirrors verbatim"
provides:
  - "src/layouts/BaseLayout.astro — Umami Cloud <script> tag inside <head> with PROD gate + data-domains server-side filter + is:inline directive (D-01/D-02/D-03)"
  - "tests/build/umami-tag-present.test.ts — 7 source-text assertions locking the Umami tag shape contract (6 RED->GREEN + 1 drift guard)"
  - "TODO_PHASE_15_UMAMI_ID placeholder committed to source at BaseLayout.astro line 47 (WEBSITE_ID const) — Jack replaces with Umami Cloud UUID pre-deploy per user_setup.dashboard_config"
affects: [15-02-analytics-forwarder, 15-03-scroll-depth, 15-04-sse-truncation-wireup, 15-05-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Belt-and-suspenders PROD gating — {import.meta.env.PROD && <script ... />} JSX-expression wrap around vendor <script> tags; Vite static-replaces the branch to false in dev + preview builds so the tag is literally absent from HTML"
    - "Vendor external-script tag in Astro — is:inline directive is mandatory to preserve external src + data-* attributes verbatim (Astro would otherwise try to bundle the external URL as a local module)"
    - "Committed-literal public-vendor IDs — Umami website IDs are visible in HTML to every visitor (not secrets); matches CF Web Analytics token pattern; one fewer env var to manage on Cloudflare Pages"
    - "Source-text test assertion pattern — readFileSync on .astro source + .toContain/.toMatch; no dist/ build step required; mirrors chat-widget-header.test.ts"

key-files:
  created:
    - tests/build/umami-tag-present.test.ts
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Landmine L2 (async vs defer) resolved as defer-only — HTML spec says when both are present async wins; Umami reference snippet uses defer; RESEARCH §3.3 recommends defer-only. Task 2 acceptance criterion grep-c 'async' === 0 locks this."
  - "Landmine L3 (is:inline on external <script>) addressed — tag emits verbatim to HTML; dist/client/index.html contains <script defer src='https://cloud.umami.is/script.js' data-website-id='TODO_PHASE_15_UMAMI_ID' data-domains='jackcutrara.com'> with no Astro bundler mangling"
  - "Landmine L4 (conditional render in template position) addressed — {import.meta.env.PROD && <script ... />} lives in the BaseLayout.astro <head> JSX template scope (not inside another <script> block)"
  - "WEBSITE_ID committed as static literal TODO_PHASE_15_UMAMI_ID (D-03) rather than env var; Umami IDs are public — no secret, one fewer Cloudflare Pages env binding, easier pre-deploy replace workflow"
  - "D-04 CF Web Analytics fallback path NOT shipped — auto-inject is assumed; Plan 05 VERIFICATION.md will curl production post-deploy to confirm cloudflareinsights.com beacon presence; explicit <script> fallback is pre-approved in CONTEXT.md Claude's Discretion if Plan 05 finds auto-inject missing"

patterns-established:
  - "JSX-expression PROD gate around vendor <script> tags — reusable shape for Plan 02's analytics.ts import wiring and any future third-party analytics tag"
  - "Multi-line comment annotations before the gate explain D-number + landmine references so future maintainers don't regress is:inline/defer/PROD-gate invariants when refactoring <head>"

requirements-completed: [ANAL-01, ANAL-06]
# NOTE: ANAL-02 (Cloudflare Web Analytics) is an operational dashboard toggle,
# not a code change — full completion lives in Plan 05 VERIFICATION.md Task
# after Jack enables Web Analytics in the CF Pages dashboard. Not marked
# complete here. ANAL-01 (Umami tag present, env-gated) and ANAL-06 (no cookie
# banner, by vendor contract) are fully satisfied by this plan's code change.

# Metrics
duration: 6min
completed: 2026-04-23
---

# Phase 15 Plan 01: Umami Analytics Tag + BaseLayout PROD Gate Summary

**Belt-and-suspenders Umami Cloud <script> landed in BaseLayout.astro <head> — PROD-gated JSX-expression wrap keeps dev/preview builds analytics-silent while `data-domains="jackcutrara.com"` gives Umami's ingest pipeline a second server-side filter; 7 source-text tests lock the tag-shape contract against future drift.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-23T23:39:00Z
- **Completed:** 2026-04-23T23:45:08Z
- **Tasks:** 2 (RED stubs + GREEN implementation)
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

- Authored `tests/build/umami-tag-present.test.ts` with 7 source-text assertions over `src/layouts/BaseLayout.astro` — 2 describe blocks (`Umami analytics tag (ANAL-01 / D-01, D-02, D-03)` + `BaseLayout is:inline precedent integrity`)
- Inserted Umami Cloud `<script is:inline defer src="https://cloud.umami.is/script.js" data-website-id={WEBSITE_ID} data-domains="jackcutrara.com">` into BaseLayout.astro `<head>` between `<SEO/>` (line 87) and the first `<Font cssVariable="--font-display-src"/>` (line 96)
- Added frontmatter `const WEBSITE_ID = "TODO_PHASE_15_UMAMI_ID"` static literal (line 47) — 5-line comment block documents D-03 reasoning and cross-references user_setup.dashboard_config for pre-deploy replacement
- All 235 tests GREEN (228 pre-existing + 7 new); 6 Task 1 RED stubs flipped GREEN by Task 2; 1 drift-guard baseline-GREEN by design
- `pnpm build` clean end-to-end (build:chat-context -> wrangler types -> astro check -> astro build -> pages-compat) with zero warnings
- PROD build `dist/client/index.html`, `dist/client/404.html`, `dist/client/about/index.html`, `dist/client/projects/seatwatch/index.html` etc. all emit exactly `1` `cloud.umami.is` occurrence — confirms the `{import.meta.env.PROD && ...}` branch evaluates `true` at build time for every page
- Zero new runtime dependencies; zero new devDependencies; zero `pnpm install` runs needed

## Task Commits

1. **Task 1: Author tests/build/umami-tag-present.test.ts (Wave 0 RED)** — `a696b34` (test)
2. **Task 2: Insert Umami tag into BaseLayout.astro with PROD gate (GREEN)** — `39cb2d1` (feat)

_Note: Task 1 is the TDD RED commit; Task 2 is the GREEN commit. No REFACTOR commit needed — the shape that flipped RED->GREEN was the spec, not a refactor target._

## Files Created/Modified

- `tests/build/umami-tag-present.test.ts` (NEW, 54 lines) — 7 source-text assertions: (1) `cloud.umami.is/script.js` substring, (2) `is:inline` + src URL co-location regex, (3) `data-domains="jackcutrara.com"` substring (D-01 filter), (4) `defer` + umami-src co-location regex (D-02), (5) `data-website-id=...` attribute present with any value (D-03 — doesn't assert the literal UUID so CI doesn't break on Umami-site rotation), (6) `{import.meta.env.PROD &&` PROD gate regex (D-01 belt-and-suspenders), (7) `is:inline` occurrence count ≤ 2 drift guard.
- `src/layouts/BaseLayout.astro` (MODIFIED, +15 lines) — WEBSITE_ID const at frontmatter line 47; Umami `<script>` block at `<head>` lines 88-95 (5-line D-number comment annotation + 1-line PROD-gated tag).

## Exact Line Range of the Umami Tag Insert

**File:** `src/layouts/BaseLayout.astro`

**Frontmatter:**
- Line 42-47: WEBSITE_ID placeholder comment + `const WEBSITE_ID = "TODO_PHASE_15_UMAMI_ID";`

**<head> template:**
- Line 88-92: 5-line JSX comment annotation (ANAL-01 attribution, PROD-gate rationale, server-side filter, Astro directive, defer-only)
- Line 93-95: `{import.meta.env.PROD && ( <script is:inline defer src="https://cloud.umami.is/script.js" data-website-id={WEBSITE_ID} data-domains="jackcutrara.com" /> )}`

**Pre-deploy replacement location:** `src/layouts/BaseLayout.astro:47` — swap `"TODO_PHASE_15_UMAMI_ID"` for the Umami Cloud website UUID. The WEBSITE_ID const flows into the tag's `data-website-id` attribute via JSX-expression interpolation, so the single-point replacement on line 47 propagates through every page of the PROD build.

## Landmine Resolution (from 15-RESEARCH.md)

| Landmine | Resolution | Evidence |
|----------|------------|----------|
| L2: async+defer — async wins per HTML spec; Umami docs use defer | Shipped `defer` only; `async` not in BaseLayout.astro | `grep -c 'async' src/layouts/BaseLayout.astro` returns 0 |
| L3: is:inline mandatory on external-src `<script>` | Shipped `is:inline` directive on the Umami tag | `grep -c 'is:inline' src/layouts/BaseLayout.astro` returns 1; `dist/client/index.html` contains `<script defer src="https://cloud.umami.is/script.js" data-website-id="..." data-domains="jackcutrara.com">` byte-preserved (Astro strips the build-time `is:inline` directive from the output but preserves src + data-*) |
| L4: `{conditional && <script.../>}` must live in Astro template position | Shipped between `<SEO/>` closing and `<Font.../>` opening — pure `<head>` JSX scope | `pnpm build` exits 0; `pnpm check` reports 0 errors / 0 warnings / 0 hints |

## D-04 Fallback Path Status

**Not shipped in Plan 01.** The CF Web Analytics happy path (dashboard auto-inject on the CF proxy for jackcutrara.com) is assumed; Plan 05's `15-VERIFICATION.md` will curl the production response post-deploy and grep for `cloudflareinsights.com` to confirm the beacon is present. If auto-inject fails (RESEARCH §4.5 MEDIUM confidence callout), the fallback path — an explicit `<script>` tag in BaseLayout.astro with the same PROD gate as Umami — is pre-approved in CONTEXT.md Claude's Discretion and can be added without a CONTEXT amendment.

## Decisions Made

- **Kept the drift-guard regression test inside the Task 1 RED commit** even though it's GREEN at baseline (current is:inline count = 0; drift guard asserts ≤ 2). Plan text described test #7 as a "guard `it`" but its acceptance criterion said all 7 RED. Matches Phase 14-05's documented plan-text-mismatch pattern. The guard flips RED only if BaseLayout grows more than 2 `is:inline` directives — exactly the future regression signal it was designed to catch (e.g., Plan 02 adding a second vendor tag that accidentally shadows the PROD gate).
- **Single-line `<script>` attribute layout** in BaseLayout.astro to satisfy the `grep -cE 'defer[[:space:]]+src="https://cloud\.umami\.is'` line-oriented acceptance criterion — an earlier multi-line attribute layout had the right visible structure but failed the regex because line-scoped grep doesn't span newlines. The single-line form keeps all attribute proximity invariants testable with default grep.
- **Rewrote the JSX comment annotations** to avoid literal attribute strings (`is:inline`, `data-domains="..."`, `async`) that would otherwise double-count in the acceptance-criterion greps. Current annotation prose describes intent (e.g., "Astro directive preserves external script tag + vendor attrs verbatim") rather than quoting the literal attribute names — the D-number references still provide the audit trail without creating false-positive grep matches.

## Deviations from Plan

None — plan executed exactly as written; the three decisions above are within plan scope (Task 2 acceptance-criteria satisfaction) and the test-#7-baseline-GREEN posture is documented in the plan's own narrative as a "guard it."

## Issues Encountered

- **Initial multi-line `<script>` attribute layout** failed the `grep -cE 'defer[[:space:]]+src=...'` line-oriented acceptance criterion (returned 0 instead of 1). Resolved in a single Edit by collapsing all 5 `<script>` attributes onto one line; all 7 grep counts now pass (cloud.umami.is/script.js=1, data-domains=1, is:inline=1, defer+src=1, import.meta.env.PROD=1, TODO_PHASE_15_UMAMI_ID=1, async=0).
- **Initial comment annotations quoted literal attribute names** inflating grep counts (is:inline=2, data-domains=2, async=1). Rewrote annotations to describe intent rather than quote attribute literals; all acceptance-criteria counts landed exactly.

Both were caught during Task 2 verification before the GREEN commit — no rework committed, just the final-state file committed once.

## User Setup Required

**External services require manual configuration before production deploy.** Two operational tasks captured in plan frontmatter `user_setup.dashboard_config`:

1. **Umami Cloud:** Create a website entry for jackcutrara.com in Umami Cloud dashboard (Websites -> Add website). Copy the `data-website-id` UUID and replace `"TODO_PHASE_15_UMAMI_ID"` on `src/layouts/BaseLayout.astro:47` before merging to main. Rationale: D-03 — Umami IDs are public and committing the placeholder lets us land the test contract now; the UUID swap is a single-line change pre-deploy.

2. **Cloudflare Web Analytics:** In the CF dashboard (Workers & Pages -> portfolio -> Metrics -> Web Analytics -> Enable), toggle Web Analytics on so the proxy auto-injects the `static.cloudflareinsights.com/beacon.min.js` on production HTML responses. Capture dashboard screenshot for Plan 05 `15-VERIFICATION.md`. No code change needed — D-04 is a dashboard-toggle-only path.

Plan 05 `15-VERIFICATION.md` will cite both steps as completed prerequisites when the phase closes.

## Next Phase Readiness

- BaseLayout `<head>` is ready for Plan 02's analytics.ts import wiring — Plan 02 adds an `<script>` block in the `<body>` (after `<ChatWidget/>`) to import `src/scripts/analytics.ts`; the D-26 client-only regression surface from Plan 04's chat.ts diff is still untouched
- D-26 Chat Regression Gate client-only surface unaffected by this plan — `src/scripts/chat.ts`, `src/components/chat/ChatWidget.astro`, and all chat-related tests are byte-identical; D-26 full client-only re-run lives in Plan 04's chat.ts change per D-15
- Server `src/pages/api/chat.ts` byte-identical (D-15 server-byte-identical gate holds)
- Zero blockers for Wave 1 parallel execution — Plan 03 (scroll-depth observer + sentinels) shares no files with Plan 01 and can run concurrently (or already ran; wave-merge is the orchestrator's concern)
- `pnpm test` full suite and `pnpm build` both clean — no carry-over tech debt from this plan

## Self-Check: PASSED

**Files verified present:**
- `src/layouts/BaseLayout.astro`: FOUND (modified)
- `tests/build/umami-tag-present.test.ts`: FOUND (created)

**Commits verified present:**
- `a696b34` (Task 1 RED): FOUND on main
- `39cb2d1` (Task 2 GREEN): FOUND on main

**Acceptance-criteria grep counts verified:**
- `grep -c 'cloud.umami.is/script.js' src/layouts/BaseLayout.astro` = 1 ✓
- `grep -c 'data-domains="jackcutrara.com"' src/layouts/BaseLayout.astro` = 1 ✓
- `grep -c 'is:inline' src/layouts/BaseLayout.astro` = 1 ✓
- `grep -cE 'defer[[:space:]]+src="https://cloud\.umami\.is' src/layouts/BaseLayout.astro` = 1 ✓
- `grep -c 'import.meta.env.PROD' src/layouts/BaseLayout.astro` = 1 ✓
- `grep -c 'TODO_PHASE_15_UMAMI_ID' src/layouts/BaseLayout.astro` = 1 ✓ (≥1 required)
- `grep -c 'async' src/layouts/BaseLayout.astro` = 0 ✓
- `grep -c 'integrity=' src/layouts/BaseLayout.astro` = 0 ✓
- `pnpm test` full suite = 235/235 GREEN (7 new Umami tests all passing) ✓
- `pnpm build` exits 0 with zero warnings ✓
- `dist/client/index.html` contains `<script defer src="https://cloud.umami.is/script.js" data-website-id="TODO_PHASE_15_UMAMI_ID" data-domains="jackcutrara.com">` ✓

---
*Phase: 15-analytics-instrumentation*
*Completed: 2026-04-23*
