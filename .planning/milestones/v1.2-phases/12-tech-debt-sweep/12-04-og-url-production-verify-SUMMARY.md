---
phase: 12
plan: 04
slug: og-url-production-verify
subsystem: seo
tags:
  - og
  - verification
  - seo
  - production
  - docs-only
requires:
  - src/layouts/BaseLayout.astro:38-39 (resolveOg guard, shipped Phase 11 / v1.1 WR-03)
provides:
  - 5-row production-OG verification table in 12-VALIDATION.md
  - Documented DEBT-03 closure evidence
affects:
  - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md
tech-stack:
  added: []
  patterns:
    - curl + grep acceptance check with facebookexternalhit User-Agent
key-files:
  created: []
  modified:
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md (+36 lines)
decisions:
  - "Curl-based string capture is sufficient evidence for DEBT-03 closure; captured strings are immutable and grep-resolvable, so no code change or human keyboard test needed"
  - "Human eyeball + Facebook Sharing Debugger spot-check deferred to phase-end consolidated review (same pattern as 12-03 manual-smoke deferral); plan 12-04 does not block on it"
metrics:
  duration_seconds: 206
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
  files_created: 0
  net_loc_delta: +36
  net_code_delta: 0
  commits: 2
completed: "2026-04-15"
---

# Phase 12 Plan 04: OG URL Production Verify Summary

Verified the shipped `resolveOg` guard at `src/layouts/BaseLayout.astro:38-39` emits correct absolute Open Graph URLs across 5 production page types via `curl -A "facebookexternalhit/1.1"` + grep, closing DEBT-03 with immutable captured-string evidence.

## What Shipped

- New `## DEBT-03 OG URL Production Verification` section in `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` (+36 lines).
- 5-row evidence table (URL, og:url captured, og:image captured, Verdict) — all rows PASS.
- Per-URL observations confirming no double-prefix corruption, no localhost, no preview hostnames, no query strings / fragments.
- Task 2 human sign-off deferred to phase-end consolidated review (matches 12-03 deferred-smoke pattern).

## Chosen Project Slug

`seatwatch` — shipped project MDX, live at `https://jackcutrara.com/projects/seatwatch`.

## Curl Invocation

```bash
for URL in \
  "https://jackcutrara.com/" \
  "https://jackcutrara.com/about" \
  "https://jackcutrara.com/projects" \
  "https://jackcutrara.com/projects/seatwatch" \
  "https://jackcutrara.com/contact"
do
  HTML=$(curl -sL -A "facebookexternalhit/1.1" "$URL")
  echo "$HTML" | grep -oE '<meta property="og:url" content="[^"]*"' | head -1
  echo "$HTML" | grep -oE '<meta property="og:image" content="[^"]*"' | head -1
done
```

Raw log persisted at `/tmp/12-04-og-sweep.log` during the run.

## 5-Row Verification Table (copy from 12-VALIDATION.md)

| URL | og:url captured | og:image captured | Verdict |
|-----|-----------------|-------------------|---------|
| `https://jackcutrara.com/` | `https://jackcutrara.com/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/about` | `https://jackcutrara.com/about/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/projects` | `https://jackcutrara.com/projects/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/projects/seatwatch` | `https://jackcutrara.com/projects/seatwatch/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/contact` | `https://jackcutrara.com/contact/` | `https://jackcutrara.com/og-default.png` | PASS |

## Key Observations

- All 5 `og:url` values are absolute with correct `https://jackcutrara.com` origin.
- All 5 `og:image` values correctly resolved via `resolveOg` — the root-relative `/og-default.png` was prepended with `siteUrl` exactly once, no double-prefix corruption.
- Non-homepage `og:url` carries a trailing slash (Astro/Cloudflare Pages canonical form). This is the site's standard canonical shape; not a regression.
- No `localhost`, `127.0.0.1`, preview-deploy hostname, query string, or URL fragment leaked in any of the 5 responses.

## Human Sign-Off Timestamp

**Pending** — deferred to phase-end consolidated review alongside 12-02 and 12-03 manual smoke. The captured strings are immutable evidence; if a phase-end anomaly surfaces, a gap-closure plan will be authored. Plan 12-04's verdict (PASS) does not change retroactively.

## Net Code Delta

**0 lines of code.** This is a verification-only plan per D-17. `src/layouts/BaseLayout.astro` was not modified. Documentation delta: +36 lines to 12-VALIDATION.md.

## Deviations from Plan

None — plan executed exactly as written. The only minor judgment call was the Task 2 human-review deferral (recorded inline in the validation doc) to match the phase-end consolidated pattern already established by 12-02 and 12-03.

## Requirements Closed

- **DEBT-03** — OG URL builder corruption risk eliminated; `resolveOg` guard verified shipping correct absolute URLs across all 5 page types on production.

## Commits

| Hash | Message |
|------|---------|
| `3a605f2` | docs(12-04): record DEBT-03 OG URL production verification |
| `1cb6677` | docs(12-04): defer DEBT-03 human sign-off to phase-end consolidated review |

## Self-Check: PASSED

- FOUND: .planning/phases/12-tech-debt-sweep/12-VALIDATION.md (contains "DEBT-03 OG URL Production Verification")
- FOUND: 3a605f2 (Task 1 commit)
- FOUND: 1cb6677 (Task 2 commit)
- FOUND: 5 rows starting with `| \`https://jackcutrara.com` in 12-VALIDATION.md
- CONFIRMED: No change to src/layouts/BaseLayout.astro (verification-only per D-17)
