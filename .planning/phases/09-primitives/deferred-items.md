# Phase 9 Deferred Items

Out-of-scope issues discovered during Phase 9 execution that were NOT fixed per the
GSD scope boundary rule ("Only auto-fix issues DIRECTLY caused by the current task's
changes"). These are logged here for later triage — typically Phase 11 polish.

## Pre-existing lightning-css warnings (discovered during 09-02)

**Discovered:** 2026-04-08 during `pnpm run build` verification of plan 09-02
**Count:** 4 warnings, all of the same pattern
**Impact:** Warnings only — build exits 0, pages prerender correctly, deployment unaffected.

Lightning-css (Tailwind v4 Oxide bundler) emits "Unexpected token Delim('*')" warnings
when it tries to parse literal example strings like `px-[var(--token-space-*)]` from
somewhere in the project's template detection surface. The four warning sites are:

1. `.px-\[var\(--token-space-\*\)\]` → `padding-inline: var(--token-space-*);`
2. `.px-\[var\(--token-space-\*\)\]` → (duplicate of #1, different wrapping)
3. `.text-\[length\:var\(--token-text-\*\)\]` → `font-size: var(--token-text-*);`
4. `.\[length\:var\(--token-text-\*\)\]` → `length: var(--token-text-*);`

**Evidence this is pre-existing (not caused by plan 09-02):**
`git stash` → `pnpm run build` → grep "Unexpected token" returns the same count (4)
on the clean base commit `0e31935 docs(09-01): complete master-amendment plan` as on
the post-edit working tree. Plan 09-02 only appends pure Phase 9 editorial helpers to
global.css; it introduces zero `[var(--token-*)]` arbitrary-value utilities.

**Likely source:** Phase 08-foundation P08 added `@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"`
to scope Tailwind template detection to `src/`, which fixed the `.planning/` markdown
regression. However, one or more files still inside the src/ detection surface contain
literal `px-[var(--token-space-*)]` / `text-[length:var(--token-text-*)]` example strings
— probably documentation comments or template literal placeholders in `.astro`/`.mdx`
files. Tailwind v4 Oxide does not distinguish literal wildcards from real utility
candidates and emits lightning-css parse warnings.

**Deferred to:** Phase 11 polish (QUAL-0x). The fix is a targeted grep-and-scrub of
`src/` to remove or escape the offending literal `var(--token-*)` / `var(--token-text-*)`
strings, or tighten `@source` further to exclude the relevant files.

**Not a blocker for:** Phase 9 primitive plans (09-02..09-08). Build exits 0, all pages
prerender, Cloudflare Workers server builds, sitemap generates.
