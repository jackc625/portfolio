---
phase: 12-tech-debt-sweep
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - wrangler.jsonc
  - eslint.config.mjs
  - src/components/primitives/Container.astro
  - src/styles/global.css
autonomous: true
requirements:
  - DEBT-01
user_setup: []
tags:
  - build
  - lint
  - config
  - wrangler
must_haves:
  truths:
    - "`pnpm build` exits 0 with zero warning lines in stdout/stderr"
    - "`pnpm exec astro check` exits 0 with zero errors and zero warnings"
    - "`pnpm lint` exits 0 with zero warnings (including zero unused-disable-directive warnings)"
    - "Wrangler `rate_limits` schema warning (×6 per build) no longer emitted"
    - "Wrangler upgrade notice (4.80 → 4.83) no longer emitted"
  artifacts:
    - path: "package.json"
      provides: "wrangler devDependency pinned to ^4.83.0"
      contains: '"wrangler": "^4.83.0"'
    - path: "wrangler.jsonc"
      provides: "Rate-limit block absent (default) OR schema-correct `ratelimits`/`name` block (permissive)"
      contains: "(EITHER: no `rate_limits`/`ratelimits` block at all — DEFAULT — OR: `\"ratelimits\": [` with `\"name\": \"CHAT_RATE_LIMITER\"`)"
    - path: "eslint.config.mjs"
      provides: "`worker-configuration.d.ts` added to global ignores"
      contains: '"worker-configuration.d.ts"'
    - path: "src/components/primitives/Container.astro"
      provides: "Stale eslint-disable at :18 removed; Props still typed"
      contains: "Astro.props"
    - path: "src/styles/global.css"
      provides: "Comment at :34 rewritten without `px-[var(--token-*)]` bracket-syntax literal; all three `@source` directives preserved verbatim"
      contains: '@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}";'
  key_links:
    - from: "eslint.config.mjs"
      to: "worker-configuration.d.ts"
      via: "ignores array"
      pattern: "worker-configuration.d.ts"
    - from: "src/pages/api/chat.ts"
      to: "application-layer rate limiter (authoritative)"
      via: "existing in-process limit enforcement"
      pattern: "rate.?limit"
---

<objective>
Close DEBT-01 by silencing every warning `pnpm build`, `pnpm exec astro check`, and `pnpm lint` emit today on the shipped v1.1 tree. Upgrade Wrangler to 4.83+, **delete the `rate_limits` block from `wrangler.jsonc`** (default path — app-layer limiter in `src/pages/api/chat.ts` is authoritative), delete the stale `eslint-disable-next-line` in `Container.astro`, add `worker-configuration.d.ts` to ESLint ignores, and rewrite the load-bearing comment in `global.css:34` without `px-[var(--token-*)]` bracket literals.

Purpose: Every subsequent v1.2 phase layers on top of this tree — leaving build warnings means every later phase has to grep past noise to find real regressions. Clean baseline = trustworthy gate.

Output: Zero-warning build pipeline verified across all three tools; Wrangler devDep bumped; Cloudflare rate-limit binding block removed (or — if the user later decides to activate the binding as a separate authorized change — renamed schema-correctly); ESLint config ignores generated type file; Container.astro and global.css cleaned.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-RESEARCH.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md

<interfaces>
<!-- Runtime rate limiting is enforced in application code (authoritative). The wrangler.jsonc `rate_limits` block has never been live: either Wrangler 4.80 ignored it (producing the ×6 warning) or the schema key was wrong. Deleting it produces ZERO behavioral change. -->
```ts
// src/pages/api/chat.ts — app-layer rate limiter (authoritative; DO NOT MODIFY in this plan)
// The existing in-process 5/60s limiter continues to enforce rate limits. No Cloudflare
// binding is required for the currently-shipped behavior.
```

<!-- If the user later authorizes activating a Cloudflare rate-limiter binding in a SEPARATE phase, the canonical schema (from RESEARCH.md §Q1) would be: -->
```jsonc
// FUTURE (not in Phase 12 scope):
"ratelimits": [
  {
    "name": "CHAT_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": { "limit": 5, "period": 60 }
  }
]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Upgrade Wrangler to 4.83+ and regenerate worker types</name>
  <read_first>
    - package.json (current devDep block at :34-47)
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §Q1 (rate_limits schema) and §Risks row 2 (types drift)
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-04, D-05
  </read_first>
  <action>
    Edit `package.json:46`: change `"wrangler": "^4.80.0"` → `"wrangler": "^4.83.0"` (caret range preserved). Run `pnpm install` to resolve lockfile. Run `pnpm exec wrangler --version` and confirm it prints a `4.83.x` line. Run `pnpm types` (defined in package.json scripts; regenerates `worker-configuration.d.ts`). Run `pnpm exec astro check` and confirm exit 0 with zero TypeScript errors — if TS errors surface from the types regeneration, pin `wrangler` incrementally (4.82 → 4.81) and re-run until clean; document the final pinned version in the task summary.
  </action>
  <verify>
    <automated>pnpm exec wrangler --version | grep -E "^⛅️ wrangler 4\.(8[3-9]|9[0-9])"</automated>
    <automated>pnpm exec astro check 2>&amp;1 | tail -1 | grep -E "0 errors.*0 warnings"</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` contains exact string `"wrangler": "^4.83.0"` (or higher minor `4.8X`)
    - `pnpm-lock.yaml` updated and staged
    - `pnpm exec wrangler --version` exits 0 and prints `4.83.x` or higher
    - `pnpm exec astro check` exits 0 with `0 errors, 0 warnings` on final line
    - `worker-configuration.d.ts` regenerated (file mtime newer than pre-task, or `git diff` shows content change)
  </acceptance_criteria>
  <done>Wrangler 4.83+ installed, worker types regenerated, TypeScript still clean.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Delete the `rate_limits` block from wrangler.jsonc</name>
  <read_first>
    - wrangler.jsonc (entire file, focus on :11-26)
    - src/pages/api/chat.ts (grep for application-layer rate-limit enforcement)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "wrangler.jsonc" section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-05 (rename OR delete discretion)
  </read_first>
  <action>
    **Delete the `rate_limits` block from wrangler.jsonc.** Rationale: app-layer rate limiting in `src/pages/api/chat.ts` is authoritative; activating a new Cloudflare binding via schema rename would double-count against the same user without user authorization, which D-05 does not grant. D-05 permits EITHER rename OR delete; the default path chosen here (delete) produces zero behavioral change because the `rate_limits` block has never been live in production (Wrangler 4.80 emitted the ×6 `Unexpected fields` warning, meaning the block was ignored entirely).

    Remove the block at `wrangler.jsonc:11-26` — the entire top-level `"rate_limits": [ … ]` array INCLUDING the leading comment block (wrangler.jsonc:6-10 explaining the 5/60s choice). Also remove any trailing comma on the preceding property that would be orphaned.

    Before:
    ```jsonc
    // (comment block explaining 5/60s choice at :6-10)
    "rate_limits": [
      {
        "binding": "CHAT_RATE_LIMITER",
        "namespace_id": "1001",
        "simple": { "limit": 5, "period": 60 }
      }
    ]
    ```

    After: **nothing** — both the comment block and the array are removed. The rest of wrangler.jsonc is byte-unchanged.

    Run `pnpm build` after the edit and confirm (a) the 6 `Unexpected fields found in top-level field: "rate_limits"` warnings no longer appear, and (b) the app-layer rate limiter in `src/pages/api/chat.ts` continues to operate (no behavioral change — confirmed by chat regression gate where applicable in plan 12-02 and 12-03).

    **Alternative path (documented, not executed):** If future-you (or the user, in a separate authorized phase) wants to activate the Cloudflare rate-limiter binding, re-introduce the block with the schema-correct shape from the `<interfaces>` block above (`"ratelimits"` / `"name"`). The must_haves are permissive: either shape (block deleted OR schema-correct `ratelimits`) passes verification.
  </action>
  <verify>
    <automated>grep -c '"rate_limits"' wrangler.jsonc</automated>
    <automated>grep -c '"ratelimits"' wrangler.jsonc</automated>
    <automated>pnpm build 2>&amp;1 | grep -Ei "unexpected fields|rate_limits" | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c '"rate_limits"' wrangler.jsonc` returns 0
    - `grep -c '"ratelimits"' wrangler.jsonc` returns 0 (block fully deleted; no schema-renamed block either)
    - `pnpm build 2>&amp;1 | grep -Ei "unexpected fields|rate_limits"` returns 0 lines
    - `pnpm build` exits with status 0
    - App-layer rate limiter in `src/pages/api/chat.ts` unmodified (confirm via `git diff src/pages/api/chat.ts` — zero lines changed)
  </acceptance_criteria>
  <done>`rate_limits` block deleted, Wrangler ×6 warning gone, build exits 0, app-layer limiter untouched.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3A: Clean Container.astro — delete stale eslint-disable</name>
  <read_first>
    - src/components/primitives/Container.astro (full file — focus on :14-20)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "Container.astro" section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-07
  </read_first>
  <action>
    In `src/components/primitives/Container.astro:14-20`, delete the stale `// eslint-disable-next-line @typescript-eslint/no-unused-vars -- consumed by Astro's type system` comment AND the `const _props: Props = Astro.props;` alias line. Replace the final destructure with PATTERNS.md Option B (keeps the `Props` interface for type annotation):

    ```astro
    interface Props {
      as?: keyof HTMLElementTagNameMap;
      class?: string;
    }
    const { as: Tag = "div", class: className }: Props = Astro.props;
    ```

    No `eslint-disable` comment remains anywhere in the file. No `_props` alias remains.
  </action>
  <verify>
    <automated>grep -c "eslint-disable" src/components/primitives/Container.astro</automated>
    <automated>grep -c "_props" src/components/primitives/Container.astro</automated>
    <automated>pnpm lint 2>&amp;1 | grep -i "Container.astro" | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - `grep "eslint-disable" src/components/primitives/Container.astro` returns 0 matches
    - `grep "_props" src/components/primitives/Container.astro` returns 0 matches
    - `pnpm lint` output has 0 lines mentioning `Container.astro` (the previous unused-disable-directive warning resolved)
    - `pnpm build` still exits 0
  </acceptance_criteria>
  <done>Container.astro cleaned — no eslint-disable, no _props alias, Props interface retained.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3B: Add worker-configuration.d.ts to ESLint ignores</name>
  <read_first>
    - eslint.config.mjs (full file — focus on :4-10 ignores entry)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "eslint.config.mjs" section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-07
  </read_first>
  <action>
    In `eslint.config.mjs:6`, append `"worker-configuration.d.ts"` to the ignores array. Current line:
    ```js
    ignores: [".astro/", "dist/", ".claude/", ".ship-safe/"],
    ```
    becomes exactly:
    ```js
    ignores: [".astro/", "dist/", ".claude/", ".ship-safe/", "worker-configuration.d.ts"],
    ```
    Bare filename matches the repo-root generated file. No `globalIgnores()` helper. No new dependency. Any `--fix` edit to `worker-configuration.d.ts` would be wiped on next `wrangler types` run, so ignoring is correct.
  </action>
  <verify>
    <automated>grep -c "worker-configuration.d.ts" eslint.config.mjs</automated>
    <automated>pnpm lint 2>&amp;1 | grep "worker-configuration" | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - `grep "worker-configuration.d.ts" eslint.config.mjs` returns 1 match (inside the ignores array)
    - `pnpm lint` output contains 0 references to `worker-configuration` (the 2 unused-disable-directive warnings at :9615, :9631 resolved)
    - `pnpm lint` exit code is 0
  </acceptance_criteria>
  <done>eslint.config.mjs ignores the generated types file; worker-configuration warnings suppressed.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3C: Rewrite global.css:34 comment without bracket-syntax literal</name>
  <read_first>
    - src/styles/global.css (lines 1-50, focus on comment block :32-40)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "global.css" section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-06, D-08
  </read_first>
  <action>
    Rewrite the comment prose at `src/styles/global.css:32-37` to strip the `px-[var(--token-*)]` bracket-syntax literal, so the `@source not` exclusion is not load-bearing for that specific string. PRESERVE all three `@source` directives verbatim (they are load-bearing for Tailwind class detection).

    Replace current comment:
    ```css
    /* Scope Tailwind class detection to source files only.
     * Tailwind v4 auto-detects template files in the repo. The .planning/ directory
     * contains v1.0 plan artifacts with literal class examples like px-[var(--token-*)]
     * that generate lightning-css parse warnings. The @source not directives exclude
     * .planning/ and design-system/ from Tailwind's detection surface. */
    ```
    with:
    ```css
    /* Scope Tailwind class detection to source files only.
     * Tailwind v4 auto-detects template files in the repo. The .planning/ directory
     * contains v1.0 plan artifacts with bracket-syntax utility class examples that
     * generated lightning-css parse warnings when Tailwind scanned them. The
     * @source not directives exclude .planning/ and design-system/ from Tailwind's
     * detection surface so those example strings never enter the class graph. */
    ```

    The three `@source` directives (`@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}";`, `@source not "../../.planning/**";`, `@source not "../../design-system/**";`) follow UNCHANGED.
  </action>
  <verify>
    <automated>grep -c "px-\[var" src/styles/global.css</automated>
    <automated>grep -c '@source "../\*\*' src/styles/global.css</automated>
    <automated>grep -c '@source not "../../.planning/' src/styles/global.css</automated>
    <automated>grep -c '@source not "../../design-system/' src/styles/global.css</automated>
    <automated>pnpm lint 2>&amp;1 | grep -cE "warning|error"</automated>
  </verify>
  <acceptance_criteria>
    - `grep "px-\[var" src/styles/global.css` returns 0 matches
    - `grep '@source "../\*\*' src/styles/global.css` returns 1 match (first directive preserved)
    - `grep '@source not "../../.planning/' src/styles/global.css` returns 1 match (second directive preserved)
    - `grep '@source not "../../design-system/' src/styles/global.css` returns 1 match (third directive preserved)
    - `pnpm lint` exits 0 with zero `warning` or `error` lines (combined with Tasks 3A/3B, all 3 unused-disable-directive warnings resolved)
  </acceptance_criteria>
  <done>global.css comment rewritten; all three `@source` directives intact; lint exits 0 with zero warnings.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Full-stack zero-warning gate verification</name>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md "Manual-Only Verifications" row "Zero-warning build check"
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-08 (zero-warning bar scope)
  </read_first>
  <action>
    Run all three commands in sequence from a clean working tree (after Tasks 1-3C committed). Capture stdout+stderr of each:

    1. `pnpm build 2>&1 | tee /tmp/12-01-build.log`
    2. `pnpm exec astro check 2>&1 | tee /tmp/12-01-astro-check.log`
    3. `pnpm lint 2>&1 | tee /tmp/12-01-lint.log`

    For each log, count warning lines with:
    ```
    grep -iE "warn|unexpected|deprecated|unused" /tmp/12-01-build.log | wc -l
    grep -iE "warn|error" /tmp/12-01-astro-check.log | wc -l
    grep -iE "warn|error" /tmp/12-01-lint.log | wc -l
    ```

    Acceptance: all three counts return 0. Record the three log file contents in the plan SUMMARY.

    Run Lighthouse CI on homepage + one project detail page per ROADMAP.md Cross-Phase Constraints. If no Lighthouse CI script exists, run `pnpm exec lighthouse https://jackcutrara.com/ --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"` against the local preview (`pnpm preview` on a fresh port). Confirm Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100.
  </action>
  <verify>
    <automated>pnpm build 2>&amp;1 | grep -iE "warn|unexpected" | wc -l</automated>
    <automated>pnpm exec astro check 2>&amp;1 | tail -1 | grep -E "0 errors.*0 warnings"</automated>
    <automated>pnpm lint 2>&amp;1 | grep -cE "warning|error"</automated>
  </verify>
  <acceptance_criteria>
    - `pnpm build 2>&1 | grep -iE "warn|unexpected" | wc -l` returns 0
    - `pnpm exec astro check` exits 0; final line matches `0 errors, 0 warnings, 0 hints`
    - `pnpm lint` exits 0; `grep -cE "warning|error"` on its output returns 0
    - Lighthouse on homepage + one project detail: Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100
    - All three log files captured and referenced in SUMMARY.md
  </acceptance_criteria>
  <done>DEBT-01 closed: build, type-check, and lint pipelines all exit 0 with zero warnings; Lighthouse gate held.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time → runtime | `wrangler.jsonc` config drives Cloudflare Workers binding registration; deleting the unused `rate_limits` block has no runtime effect because it was never live (Wrangler 4.80 ignored it with ×6 warning) |
| ESLint config → CI | `eslint.config.mjs` ignores govern what `pnpm lint` checks; over-broad ignores could hide real issues |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-01-01 | Tampering | wrangler.jsonc rate-limit binding deletion | mitigate | No behavioral change: the `rate_limits` block was ignored by Wrangler 4.80 (emitted ×6 `Unexpected fields` warning, meaning never parsed into a live binding). The app-layer rate limiter in `src/pages/api/chat.ts` remains authoritative and continues to enforce 5/60s. Task 2 acceptance criteria confirms `src/pages/api/chat.ts` is byte-unchanged. Severity: **LOW** — deleting unused config produces zero runtime delta. |
| T-12-01-02 | Information disclosure | worker-configuration.d.ts in ignores | accept | Task 3B only ignores a generated-from-`wrangler types` file — no source file suppression. Auditor reading `eslint.config.mjs` sees exactly one new ignore entry with obvious provenance (the filename itself). Severity: Low. |
| T-12-01-03 | Denial of service | Wrangler upgrade TS drift | mitigate | RESEARCH.md §Risks row 2: if Wrangler types regeneration breaks TS, plan pins to 4.82 or 4.81. Task 1 explicitly runs `pnpm exec astro check` post-upgrade to catch drift. Rollback is a single-line `package.json` revert. Severity: Low. |
</threat_model>

<verification>
All tasks automated-verified. Plan-level sign-off: `pnpm build && pnpm exec astro check && pnpm lint` exits 0 with zero warning lines across all three tools. Lighthouse on homepage + one project detail holds 99/95/100/100. No D-26 gate required (this plan does NOT touch `src/scripts/chat.ts`, `src/pages/api/chat.ts`, `src/layouts/BaseLayout.astro`, or any other chat-adjacent surface — only config + Container primitive + global.css comment).
</verification>

<success_criteria>
- `pnpm build` exits 0 with zero warning lines
- `pnpm exec astro check` reports `0 errors, 0 warnings, 0 hints`
- `pnpm lint` exits 0 with zero warnings
- Wrangler devDep pinned to ^4.83.0 (or incrementally-pinned 4.82/4.81 if TS drift forced fallback, documented in SUMMARY)
- `wrangler.jsonc` has NO `rate_limits` or `ratelimits` block (default path taken per D-05 discretion + revision guidance)
- `src/pages/api/chat.ts` byte-unchanged (app-layer rate limiter preserved as authoritative)
- `eslint.config.mjs` ignores `worker-configuration.d.ts`
- `src/components/primitives/Container.astro` has zero `eslint-disable` comments
- `src/styles/global.css` comment at :32-37 carries no `px-[var(--token-*)]` literal; all three `@source` directives intact
- Lighthouse CI holds 99/95/100/100 on homepage + one project detail
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-01-SUMMARY.md` with:
- Final Wrangler version pinned (4.83.x or fallback)
- `wrangler.jsonc` decision: DELETE (default per D-05 discretion + revision guidance); confirm `src/pages/api/chat.ts` unchanged
- Three log file contents (`pnpm build`, `pnpm exec astro check`, `pnpm lint`) showing zero warnings
- Lighthouse report scores
- Any Claude's-discretion notes (e.g., Option A vs Option B in Container.astro)
</output>
