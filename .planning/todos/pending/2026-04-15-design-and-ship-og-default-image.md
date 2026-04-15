---
created: 2026-04-15T23:50:56.000Z
title: Design and ship a real og-default.png
area: ui
files:
  - public/og-default.png
  - src/layouts/BaseLayout.astro:23
---

## Problem

`public/og-default.png` exists at the correct 1200×630 OG dimensions and serves 200 OK on production (`curl -I https://jackcutrara.com/og-default.png` → 200, image/png, ETag d4517490...), but the file is only 3,631 bytes — effectively a blank/placeholder. Social-media unfurls on Slack/Discord/iMessage show the link card with no visual content, which undercuts the recruiter-facing "living complement to a resume" value promised in PROJECT.md.

Surfaced during Phase 12 UAT Test 5 (OG preview verification). Jack's words: "Everything looks fine except for the fact that we are missing an OG image." The og:url and og:image-URL plumbing is correct (DEBT-03 verified 5/5); only the image asset itself is inadequate.

## Solution

1. Design a 1200×630 og-default image that matches the editorial design system:
   - Six-token palette (`--bg #FAFAF7`, `--ink #0A0A0A`, `--accent #E63946`, etc.)
   - Geist / Geist Mono typography
   - Name + role + URL, minimal/editorial composition
2. Route the design through the frontend-design skill per project convention (no ad-hoc design).
3. Consider per-page og:image overrides: each project case study could ship its own OG image (`/og/seatwatch.png`, etc.) via the `ogImage` prop on `BaseLayout.astro`.
4. Replace `public/og-default.png` and verify via:
   - Facebook Sharing Debugger (force re-scrape cache)
   - Slack/Discord unfurl (after cache clears)
   - opengraph.xyz preview
5. Re-run Phase 12 UAT Test 5 to confirm unfurls now show the designed image.

## Context

- Phase 12 DEBT-03 verified og:url resolution (5/5 PASS in 12-VALIDATION.md); this todo is strictly about image asset quality, not URL plumbing.
- BaseLayout's `resolveOg()` guard already handles absolute-vs-relative image URLs; no code change needed for overrides.
- Social platforms aggressively cache OG images — after replacement, use Facebook Debugger's "Scrape Again" to force refresh on Facebook/Instagram, and test a fresh URL (or cache-busting query param) on Slack/Discord.
