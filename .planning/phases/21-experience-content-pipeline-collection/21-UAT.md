---
status: complete
phase: 21-experience-content-pipeline-collection
source: [21-VERIFICATION.md]
started: 2026-07-09T09:08:28Z
updated: 2026-07-09T12:39:09Z
---

## Current Test

[testing complete]

## Tests

### 1. Holloway deep-dive body content quality
expected: Opens with the "Contract engagement" lede, then Overview → Highlights → Themes, reading coherently with no garbled formatting; content framing approved for the audience.
result: pass

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- id: G1
  truth: "User-facing copy contains no em dashes (—) anywhere it renders on the site."
  status: resolved
  reason: "User reported (verbatim): 'EM DASHES EVERYWHERE. THAT ACTUALLY NEEDS TO BE FIXED NOW. I DONT CARE IF THEYRE PREEXISTING OR OUT OF SCOPE. WE NEED TO REMOVE ANY AND ALL USAGE OF THE EM DASH IN USER FACING COPY' — later clarified: zero em dashes in all authored user-facing copy site-wide; chat pipeline and en dashes left as-is."
  severity: minor
  test: 1
  scope: site-wide (not only Holloway)
  root_cause: "Copy was authored with em dashes as parenthetical/appositive breaks. Holloway experience body rendered them directly; project case-study MDX bodies had already been hand-cleaned but their Projects/*.md source fences still carried em dashes (sync drift)."
  fix:
    - "Experience/HOLLOWAY_EXPERIENCE.md fenced body: 19 em dashes -> colons/commas/periods; re-synced to src/content/experience/holloway.mdx (word-diff confirms only em dashes changed)."
    - "Projects/{1..6}-*.md source fences: 64 em dashes removed by splicing the already-clean displayed MDX bodies back into the fences; clears the pre-existing sync drift (sync:check now exit 0). Displayed MDX byte-unchanged."
  left_intact_per_user:
    - "Chat pipeline (portfolio-context.json, about-chat.ts, system-prompt.ts, project chatSummary fields) — not displayed; user said leave."
    - "En dashes (–) in date/number ranges — user said leave."
    - "Code comments / JSDoc and non-fenced Projects/*.md design-doc sections — not user-facing."
  verification:
    - "grep — src/content/experience: 0"
    - "grep — project MDX bodies: 0 (only chatSummary line 5 remains, chat pipeline)"
    - "grep — all Projects/*.md fenced blocks: 0"
    - "sync:experience:check + sync:check: both exit 0 (no drift)"
    - "astro check: 0 errors; pnpm test: 609 passed / 2 skipped; pnpm build: Complete"
