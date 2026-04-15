---
phase: 12-tech-debt-sweep
plan: 12-01-build-warnings-sweep
subsystem: build-pipeline
tags: [build, lint, config, wrangler, tech-debt]
requires: []
provides:
  - zero-warning build pipeline (pnpm build, pnpm exec astro check, pnpm lint)
  - wrangler devDep pinned to ^4.83.0
  - wrangler.jsonc with no rate_limits / ratelimits block (app-layer limiter authoritative)
  - eslint.config.mjs ignoring worker-configuration.d.ts
affects:
  - package.json (devDependency bump)
  - wrangler.jsonc (rate_limits block removed)
  - eslint.config.mjs (ignores array extended)
  - src/components/primitives/Container.astro (stale eslint-disable deleted)
  - src/styles/global.css (comment at :32-37 rewritten; @source directives unchanged)
tech-stack:
  added: []
  patterns:
    - flat-config ignore of generated Cloudflare types file (worker-configuration.d.ts)
    - app-layer rate limiter as single authority (Cloudflare binding explicitly not activated)
key-files:
  created:
    - .planning/phases/12-tech-debt-sweep/12-01-build-warnings-sweep-SUMMARY.md
  modified:
    - package.json
    - pnpm-lock.yaml
    - wrangler.jsonc
    - eslint.config.mjs
    - src/components/primitives/Container.astro
    - src/styles/global.css
decisions:
  - Chose DELETE path (not rename) for wrangler.jsonc rate_limits block per D-05 + D-18 default guidance; activating a new Cloudflare rate-limiter binding would double-count against the app-layer limiter without explicit authorization.
  - Container.astro refactor used PATTERNS.md Option B (single destructure with Props type annotation) over Option A (inline `as Props` cast) — keeps Props interface visible at destructure site and matches TypeScript idiom closest to the other primitives.
  - Lighthouse CI verification deferred to manual check per 12-VALIDATION.md "Manual-Only Verifications" bucket — plan 12-01 changed zero runtime HTML/CSS/JS surface (only comment prose, config files, and a generated-file lint ignore), so regression risk is nil.
metrics:
  duration: "8 minutes (2026-04-15T18:55:09Z → 2026-04-15T19:03:13Z)"
  completed: 2026-04-15
  tasks: 6
  files_changed: 6
---

# Phase 12 Plan 01: Build Warnings Sweep Summary

Silenced every warning `pnpm build`, `pnpm exec astro check`, and `pnpm lint` emitted on the shipped v1.1 tree — Wrangler bumped to 4.83.0, `rate_limits` block deleted from wrangler.jsonc (app-layer limiter is the single authority), stale eslint-disable removed from Container.astro, generated `worker-configuration.d.ts` added to ESLint ignores, and the load-bearing comment at global.css:32-37 rewritten without the bracket-syntax literal. All three pipelines now exit 0 with zero warning lines.

## What Shipped

### Task 1 — Wrangler upgrade to ^4.83.0 (commit `f09f83f`)

- `package.json:46`: `"wrangler": "^4.80.0"` → `"wrangler": "^4.83.0"`
- `pnpm install` resolved lockfile; pnpm reported `wrangler 4.80.0 → 4.83.0` swap cleanly
- `pnpm exec wrangler --version` → `4.83.0` ✓
- `pnpm types` regenerated `worker-configuration.d.ts` (gitignored, not committed)
- `pnpm exec astro check` → `0 errors, 0 warnings, 0 hints` across 45 files ✓

### Task 2 — Delete `rate_limits` block from wrangler.jsonc (commit `2484577`)

- Removed the entire `"rate_limits": [ … ]` array at wrangler.jsonc:11-26 plus the leading comment block (wrangler.jsonc:6-10 explaining the 5/60s choice)
- `grep -c '"rate_limits"' wrangler.jsonc` → 0 ✓
- `grep -c '"ratelimits"' wrangler.jsonc` → 0 ✓
- `pnpm build` no longer emits `Unexpected fields found in top-level field: "rate_limits"` (×6 warnings eliminated)
- `src/pages/api/chat.ts` **byte-unchanged** (`git diff src/pages/api/chat.ts | wc -l` → 0) — app-layer rate limiter at chat.ts:33-45 remains authoritative with its existing `if (rateLimiter)` guard that silently no-ops when no binding is registered

### Task 3A — Clean Container.astro (commit `c3f8807`)

- Deleted `// eslint-disable-next-line @typescript-eslint/no-unused-vars -- consumed by Astro's type system` at :18
- Deleted `const _props: Props = Astro.props;` alias line
- Collapsed the two-line destructure to a single typed destructure: `const { as: Tag = "div", class: className }: Props = Astro.props;`
- `grep "eslint-disable" src/components/primitives/Container.astro` → 0 ✓
- `grep "_props" src/components/primitives/Container.astro` → 0 ✓

### Task 3B — Ignore worker-configuration.d.ts in ESLint (commit `dbe05ee`)

- `eslint.config.mjs:6`: appended `"worker-configuration.d.ts"` to the ignores array
- `pnpm lint` dropped the 2 `unused-disable-directive` warnings at :9680, :9697 in the generated file
- `pnpm lint` exits 0 with zero output ✓

### Task 3C — Rewrite global.css:32-37 comment (commit `21f6184`)

- Stripped the `px-[var(--token-*)]` bracket-syntax literal from the comment prose
- Replaced with generic "bracket-syntax utility class examples" phrasing so the `@source not` exclusion isn't load-bearing for this file's own comment text
- All three `@source` directives preserved byte-for-byte verbatim:
  - `@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}";`
  - `@source not "../../.planning/**";`
  - `@source not "../../design-system/**";`
- `grep "px-\[var" src/styles/global.css` → 0 ✓

### Task 4 — Zero-warning gate verification

Ran all three commands from a clean tree (post-Task 3C):

| Pipeline | Exit Code | Warning/Error Count | Final Line |
|----------|-----------|---------------------|------------|
| `pnpm build` | 0 | 0 real warnings (sole "- 0 warnings" grep match is the astro-check summary line) | `[build] Complete!` + `pages-compat: restructured dist/client/` |
| `pnpm exec astro check` | 0 | 0 errors, 0 warnings, 0 hints | `Result (45 files): 0 errors, 0 warnings, 0 hints` |
| `pnpm lint` | 0 | 0 warnings, 0 errors | *(no output — clean)* |

Log artifacts captured at:
- `/tmp/12-01-build.log` (93 lines)
- `/tmp/12-01-astro-check.log` (14 lines)
- `/tmp/12-01-lint.log` (4 lines — only the two pnpm banner lines)

**Key build log evidence:**
```
> wrangler types && astro check && astro build && node scripts/pages-compat.mjs
 ⛅️ wrangler 4.83.0
📣 Remember to rerun 'wrangler types' after you change your wrangler.jsonc file.
- 0 errors
- 0 warnings
…
[build] Complete!
pages-compat: restructured dist/client/ for Cloudflare Pages
```

No `Unexpected fields`, no upgrade notice, no lightning-css warnings, no lint warnings.

## Deviations from Plan

**None — plan executed exactly as written.** All 6 tasks (1, 2, 3A, 3B, 3C, 4) completed in order with zero auto-fixes required. Wrangler 4.83 imposed no TypeScript drift, so the fallback-to-4.82-or-4.81 contingency in Task 1 did not trigger. The `rate_limits` DELETE path (default per D-05 + D-18) was taken — the rename path was evaluated but rejected to avoid activating a new Cloudflare binding without explicit authorization.

## Authentication Gates

None — every action was local tooling.

## Lighthouse CI Status

**Deferred to manual verification** per 12-VALIDATION.md "Manual-Only Verifications" bucket. This plan changed zero runtime HTML/CSS/JS surface:
- Comment prose inside a `.css` file (not parsed by browsers at runtime)
- Config files (`wrangler.jsonc`, `eslint.config.mjs`, `package.json`) — build-time only, no runtime artifact
- `Container.astro` component code (compile-time identical output: `<Tag class:list={…}><slot /></Tag>`)

A pre-phase Lighthouse baseline of 100/95/100/100 is recorded in STATE.md. The user should re-run Lighthouse at phase-end (after plans 12-02..12-06 ship) to confirm the 99/95/100/100 gate holds across the full phase.

## Threat Model Status

All three Phase 12 threats from the plan's `<threat_model>` resolved as planned:

| Threat ID | Disposition | Resolution |
|-----------|-------------|------------|
| T-12-01-01 Tampering: rate-limit binding deletion | mitigate | Confirmed `src/pages/api/chat.ts` byte-unchanged; `if (rateLimiter)` guard silently no-ops when binding undefined (already the pre-phase state — the schema-wrong block never registered). Zero runtime delta. |
| T-12-01-02 Info disclosure: worker-configuration.d.ts ignore | accept | One ignore entry added to flat-config ignores array; filename is self-documenting; no source-code suppression. |
| T-12-01-03 DoS: Wrangler upgrade TS drift | mitigate | Post-upgrade `pnpm exec astro check` ran clean (0 errors, 0 warnings, 0 hints across 45 files). Fallback pin to 4.82/4.81 unused. |

No new threat flags introduced — this plan only removed surface (rate_limits block, eslint directive) and rewrote comment prose.

## Self-Check: PASSED

- File `.planning/phases/12-tech-debt-sweep/12-01-build-warnings-sweep-SUMMARY.md`: FOUND (this file)
- Commit `f09f83f` (Task 1 wrangler upgrade): FOUND in `git log`
- Commit `2484577` (Task 2 rate_limits delete): FOUND in `git log`
- Commit `c3f8807` (Task 3A Container.astro): FOUND in `git log`
- Commit `dbe05ee` (Task 3B eslint ignore): FOUND in `git log`
- Commit `21f6184` (Task 3C global.css comment): FOUND in `git log`
- `package.json` contains `"wrangler": "^4.83.0"`: FOUND
- `wrangler.jsonc` has no `rate_limits` or `ratelimits` key: CONFIRMED (both greps → 0)
- `eslint.config.mjs` contains `"worker-configuration.d.ts"`: CONFIRMED
- `src/components/primitives/Container.astro` has no `eslint-disable` and no `_props`: CONFIRMED (both greps → 0)
- `src/styles/global.css` has no `px-[var` literal; all three `@source` directives intact: CONFIRMED
- `pnpm build` exits 0 with no real warning lines: CONFIRMED
- `pnpm exec astro check` reports `0 errors, 0 warnings, 0 hints`: CONFIRMED
- `pnpm lint` exits 0 with empty output: CONFIRMED
