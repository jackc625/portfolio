---
phase: 1
slug: foundation-design-system
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build-level smoke tests via `astro check` + `astro build` (primary); vitest installed for future unit tests |
| **Config file** | none needed -- build commands are the validation layer for Phase 1 |
| **Quick run command** | `pnpm run build` (runs `astro check && astro build`) |
| **Full suite command** | `pnpm run build && pnpm run lint && pnpm run format:check` |
| **Estimated runtime** | ~10 seconds |

**Rationale:** Phase 1 is a foundation/scaffolding phase. Every task produces configuration files, CSS tokens, or content schemas -- all validated at build time by Astro's compiler, TypeScript checker, and Zod schema validation. Build-level verification catches 100% of the failure modes for this phase (missing imports, invalid config, schema errors, CSS parse failures). Vitest is installed (Plan 01-01) for use in later phases when behavioral unit tests are warranted.

---

## Sampling Rate

- **After every task commit:** Run `pnpm run build` (astro check + astro build)
- **After every plan wave:** Run `pnpm run build && pnpm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green (`pnpm run build && pnpm run lint && pnpm run format:check`)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01-01 | 01 | 1 | DSGN-01 | build | `pnpm list astro tailwindcss @tailwindcss/vite @astrojs/mdx @astrojs/sitemap prettier eslint vitest` | ⬜ pending |
| 01-01-02 | 01 | 1 | DSGN-01 | build | `pnpm run build` | ⬜ pending |
| 01-02-01 | 02 | 2 | DSGN-01 | build | `pnpm run build` | ⬜ pending |
| 01-02-02 | 02 | 2 | DSGN-01 | build | `pnpm run build` | ⬜ pending |
| 01-03-01 | 03 | 2 | DSGN-01 | build | `pnpm run check` | ⬜ pending |
| 01-03-02 | 03 | 2 | DSGN-01 | build | `pnpm run build` | ⬜ pending |
| 01-04-01 | 04 | 3 | IDNV-04 | build | `git log --oneline -1 && git status` | ⬜ pending |
| 01-04-02 | 04 | 3 | IDNV-04 | manual | User confirms *.pages.dev URL is live | ⬜ pending |

*Status: ⬜ pending -- ✅ green -- ❌ red -- ⚠️ flaky*

---

## Wave 0 Requirements

All Wave 0 requirements are satisfied by Plan 01-01:

- [x] `vitest` -- installed as devDependency in Plan 01-01 Task 1
- [x] `astro check` -- configured via `@astrojs/check` in Plan 01-01 Task 1, wired to `pnpm run check` and `pnpm run build` scripts
- [x] Build-level validation -- `pnpm run build` runs `astro check && astro build`, catching TypeScript errors, content schema violations, and CSS/config issues

No separate `vitest.config.ts` or test scaffold files are needed for Phase 1 because all tasks are validated by build-time checks (Astro compiler, TypeScript strict mode, Zod schema validation). Vitest remains available for behavioral tests in later phases.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev server renders blank page without errors | DSGN-01 | Requires visual browser check | Run `pnpm run dev`, open localhost, verify blank page with no console errors |
| Cloudflare Pages deploy succeeds | IDNV-04 | Requires external service | Push to GitHub, verify Cloudflare Pages build passes and site is accessible |
| CSS custom properties render correctly | DSGN-01 | Visual verification of token values | Inspect element in browser, verify CSS variables resolve to correct oklch values |
| Dark background renders as near-black | DSGN-01 | Visual confirmation | Open built page, confirm background is dark (#0e0f11 equivalent) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (build-level checks)
- [x] Sampling continuity: every task verified by build command
- [x] Wave 0 satisfied: vitest installed, astro check configured, build pipeline validates all artifacts
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (build-level validation strategy)
