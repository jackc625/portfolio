---
phase: 12-tech-debt-sweep
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md
autonomous: true
requirements:
  - DEBT-03
user_setup: []
tags:
  - og
  - verification
  - seo
  - production
must_haves:
  truths:
    - "All 5 production URLs (homepage, about, projects index, one project detail, contact) return valid absolute `og:url` meta tags"
    - "All 5 URLs return valid absolute `og:image` meta tags — no `https://jackcutrara.comhttps://…` double-prefix corruption"
    - "Evidence recorded as a 5-row table in 12-VALIDATION.md with URL, og:url captured, og:image captured, verdict"
    - "No code change required unless a regression surfaces (resolveOg guard at BaseLayout.astro:38-39 already ships)"
  artifacts:
    - path: ".planning/phases/12-tech-debt-sweep/12-VALIDATION.md"
      provides: "New `## DEBT-03 OG URL Production Verification` section with 5-row table + curl command + per-URL verdict"
      min_lines: 20
      contains: "DEBT-03 OG URL Production Verification"
  key_links:
    - from: "production jackcutrara.com pages"
      to: "Open Graph meta tags"
      via: "astro-seo emission in BaseLayout.astro"
      pattern: 'og:url|og:image'
---

<objective>
Close DEBT-03 by verifying the already-shipped `resolveOg` guard at `src/layouts/BaseLayout.astro:38-39` correctly emits absolute Open Graph URLs across all 5 page types on production jackcutrara.com. No code change is in-scope for this plan — per D-17 Phase 12 scope is verification only. Record the evidence as a 5-row table in `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md`. If any URL shows a regression (wrong origin, relative path emitted as OG URL, double-prefix corruption), escalate as a gap and author a follow-up plan.

Purpose: The v1.1 WR-03 audit found that `BaseLayout.astro:49,67` had a latent bug where already-absolute OG image URLs (e.g., CDN URLs) would be corrupted into `https://jackcutrara.comhttps://cdn.example.com/hero.png`. The guard shipped in Phase 11. This plan is the production smoke test — closing the audit item requires provable evidence, not "it looks fine."

Output: One new section in 12-VALIDATION.md with the 5-row table + curl invocation used + timestamp + verdict per URL.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-RESEARCH.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md
@.planning/phases/12-tech-debt-sweep/12-VALIDATION.md
@src/layouts/BaseLayout.astro

<interfaces>
<!-- Already-shipped resolveOg guard at BaseLayout.astro:34-40 (DO NOT MODIFY) -->
```astro
// WR-03: Pass-through absolute URLs (e.g., CDN OG images) unchanged. Only
// prepend siteUrl for root-relative paths like "/og-default.png". Without
// this guard, `${siteUrl}${ogImage}` would corrupt absolute URLs into
// `https://jackcutrara.comhttps://cdn.example.com/hero.png`.
const resolveOg = (img: string) =>
  /^https?:\/\//i.test(img) ? img : `${siteUrl}${img}`;
const resolvedOgImage = resolveOg(ogImage);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run 5-URL production curl sweep + record results</name>
  <read_first>
    - src/layouts/BaseLayout.astro (verify resolveOg still ships at :34-40 or thereabouts)
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md "Manual-Only Verifications" row for DEBT-03
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §Q4 (OG URL verification method)
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-17, D-18
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "src/layouts/BaseLayout.astro — verification-only" section
  </read_first>
  <action>
    **Step 1 — Identify one real project slug on production.** Pick any shipped project page by listing `src/content/projects/*.mdx` slugs. Record the chosen slug in the task SUMMARY.

    **Step 2 — Run curl sweep.** Execute this bash (or Windows-equivalent — use Git Bash or WSL on win32) loop against production:
    ```bash
    for URL in \
      "https://jackcutrara.com/" \
      "https://jackcutrara.com/about" \
      "https://jackcutrara.com/projects" \
      "https://jackcutrara.com/projects/&lt;CHOSEN-SLUG&gt;" \
      "https://jackcutrara.com/contact"
    do
      echo "=== $URL ==="
      curl -sL -A "facebookexternalhit/1.1" "$URL" \
        | grep -Ei '&lt;meta[^&gt;]*property="og:(url|image)"' \
        | head -4
      echo
    done | tee /tmp/12-04-og-sweep.log
    ```

    (Substitute `&lt;CHOSEN-SLUG&gt;` with the real slug from Step 1.)

    **Step 3 — Verdict per URL:**
    - PASS if `og:url` is an absolute `https://jackcutrara.com/...` matching the requested path exactly (no trailing double-slash, no `localhost`, no `https://jackcutrara.comhttps://...`)
    - PASS if `og:image` is either (a) an absolute `https://jackcutrara.com/...` for root-relative defaults OR (b) an absolute `https://cdn.example.com/...` / `https://<external-host>/...` passthrough with no prefix corruption
    - FAIL on any mismatch; escalate to a gap-closure plan

    **Step 4 — Write 5-row table into `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md`.** Append a new section at the end of the file (after existing "Validation Sign-Off") with this exact markdown shape:

    ```markdown
    ---

    ## DEBT-03 OG URL Production Verification

    **Run date:** YYYY-MM-DD
    **Commit SHA at time of run:** &lt;HEAD SHA&gt;
    **User-Agent:** `facebookexternalhit/1.1`
    **Command:** see `/tmp/12-04-og-sweep.log` for raw output
    **Chosen project slug:** `&lt;slug&gt;`

    | URL | og:url captured | og:image captured | Verdict |
    |-----|-----------------|-------------------|---------|
    | `https://jackcutrara.com/` | `https://jackcutrara.com/` | `https://jackcutrara.com/og-default.png` | PASS |
    | `https://jackcutrara.com/about` | `https://jackcutrara.com/about` | `...` | PASS |
    | `https://jackcutrara.com/projects` | `https://jackcutrara.com/projects` | `...` | PASS |
    | `https://jackcutrara.com/projects/&lt;slug&gt;` | `https://jackcutrara.com/projects/&lt;slug&gt;` | `...` | PASS |
    | `https://jackcutrara.com/contact` | `https://jackcutrara.com/contact` | `...` | PASS |

    **All-pass verdict:** DEBT-03 closed — `resolveOg` guard at `src/layouts/BaseLayout.astro:34-40` verified shipping correct absolute URLs across all 5 page types on production. No code change required.
    ```

    If any row fails, write the actual captured value in the table (do NOT write "PASS" for a failing row), mark verdict as FAIL, and raise a gap. Do NOT mutate `BaseLayout.astro` in this plan — code fixes belong in a new gap-closure plan.

    **Step 5 (fallback):** If curl against production blocks crawlers (403) or returns SSR-only HTML without OG tags, fall back to the Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/) + LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) + X Cards Validator. Paste each URL, click "Scrape Again", and record the returned og:url and og:image in the same 5-row table. Note the fallback method in the section header.
  </action>
  <verify>
    <automated>grep -c "DEBT-03 OG URL Production Verification" .planning/phases/12-tech-debt-sweep/12-VALIDATION.md</automated>
    <automated>grep -cE "^\| \`https://jackcutrara.com" .planning/phases/12-tech-debt-sweep/12-VALIDATION.md</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` contains a section titled `## DEBT-03 OG URL Production Verification` (exact string)
    - Section includes a 5-row markdown table with columns: URL | og:url captured | og:image captured | Verdict
    - All 5 rows have explicit URL values AND captured og:url / og:image values (not placeholders)
    - All 5 rows have either `PASS` or `FAIL` verdict
    - If all PASS: section ends with "DEBT-03 closed — …" summary line
    - If any FAIL: section ends with "DEBT-03 REGRESSION — escalating to gap-closure plan 12-07" and a new plan is NOT authored in-scope (escalation only)
    - Raw curl log available at `/tmp/12-04-og-sweep.log` OR fallback method documented
    - NO changes to `src/layouts/BaseLayout.astro` (per D-17)
  </acceptance_criteria>
  <done>DEBT-03 closed (all-PASS) or escalated (any-FAIL); evidence recorded in 12-VALIDATION.md; no code change.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Developer signs off on OG verification evidence</name>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md "## DEBT-03 OG URL Production Verification" section (just authored)
  </read_first>
  <what-built>
    The 5-row production-OG verification table is in 12-VALIDATION.md. Developer (Jack) visually reviews the captured og:url and og:image strings for any anomaly the grep couldn't catch (e.g., subtle trailing slashes, wrong canonical origin, stale OG image for a recently-edited page).
  </what-built>
  <action>See &lt;how-to-verify&gt; block below — this is a checkpoint:human-verify task; the developer reviews the 5-row OG URL verification table populated by Task 1, spot-checks one URL in the Facebook Sharing Debugger, and records sign-off in 12-VALIDATION.md.</action>
  <how-to-verify>
    1. Open `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` and scroll to `## DEBT-03 OG URL Production Verification`
    2. Eyeball each of the 5 rows:
       - og:url exactly matches the Requested URL (modulo trailing slash on homepage)
       - og:image is absolute (starts with `https://`)
       - No `https://jackcutrara.comhttps://...` double-prefix anywhere
       - No `localhost`, no `127.0.0.1`, no preview-deploy hostnames leaked
       - No query strings or fragments leaked
    3. Open one URL in a real client to sanity-check: paste https://developers.facebook.com/tools/debug/ and spot-check the homepage + project detail. Confirm Open Graph preview card renders correctly in Facebook Sharing Debugger.
    4. Sign off — type "approved" to close Task 2 and the plan.
    5. If any row feels wrong: describe the anomaly and escalate. Do NOT fix it in this plan (per D-17 — code changes are out of scope; a gap-closure plan is required if a regression is real).
  </how-to-verify>
  <verify><automated>grep -c &quot;DEBT-03 OG URL Production Verification&quot; .planning/phases/12-tech-debt-sweep/12-VALIDATION.md</automated></verify>
  <resume-signal>Type "approved" after eyeballing the 5-row table and Facebook Debugger spot-check, or describe any anomaly for escalation.</resume-signal>
  <acceptance_criteria>
    - Developer (Jack) has reviewed the 5-row table and confirmed no anomaly
    - Facebook Sharing Debugger render confirmed for at least homepage + one project detail
    - Sign-off recorded in 12-VALIDATION.md as a trailing line: "Reviewed and approved by &lt;user&gt; on YYYY-MM-DD"
  </acceptance_criteria>
  <done>DEBT-03 verification human-signed-off, no regression surfaced.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

N/A — this plan is verification-only against already-shipped code. No new code surface is introduced. No runtime dependency change. No build config change. No threat model edits required beyond "docs-only verification — no attack surface introduced."

If verification surfaces a regression, a follow-up gap-closure plan will carry its own threat model.
</threat_model>

<verification>
Plan-level sign-off: 5-row table populated in 12-VALIDATION.md with all-PASS verdicts AND human review recorded. If any row is FAIL, plan exits at Task 1 Step 5 with gap escalation and does NOT mark DEBT-03 as closed.
</verification>

<success_criteria>
- `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` contains `## DEBT-03 OG URL Production Verification` section
- 5-row table populated with actual captured og:url + og:image values
- All 5 rows verdict = PASS (or one plan is escalated if any FAIL)
- `src/layouts/BaseLayout.astro` unchanged in this plan
- No new dependencies
- No Lighthouse impact (no code change)
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-04-SUMMARY.md` with:
- Chosen project slug used in Step 2
- Copy of the 5-row table from 12-VALIDATION.md
- Curl invocation used (or fallback method description)
- Human sign-off timestamp
- Net code delta: 0 lines (verification-only plan)
</output>
