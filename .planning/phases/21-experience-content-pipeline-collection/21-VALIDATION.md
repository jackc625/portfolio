---
phase: 21
slug: experience-content-pipeline-collection
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-08
validated: 2026-07-09
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `21-RESEARCH.md` § Validation Architecture. Task IDs finalize at planning; rows below are keyed to Success Criteria / requirements until then.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` (`include: ["tests/**/*.test.ts"]`, node env, globals) |
| **Quick run command** | `pnpm test` (`vitest run`) |
| **Full suite command** | `pnpm test && pnpm build` (build = `build:chat-context && wrangler types && astro check && astro build`) |
| **Estimated runtime** | ~60s (test suite) + build gate |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 — sync unit tests | 21-01 | 0 | EXP-01 (SC1) | T-21-01 (path traversal) | `source:` path escaping repo root exits 2 — test asserts BOTH the `escapes project root` message AND captured `err.status === 2` (review finding #2); lifted `readSourceField`/`sliceFrontmatter`/`extractFence`/`normalize` behave | unit + integration | `pnpm test` (`tests/scripts/sync-experience.test.ts`) | ✅ | ✅ green |
| W0 — `--check` drift tests | 21-01 | 0 | EXP-01 (SC1) | — | Clean tree exits 0; mutated fenced source exits 1 (`status === 1`) | integration (execFileSync in tmpdir) | `pnpm test` (`tests/scripts/sync-experience-check.test.ts`) | ✅ | ✅ green |
| W0 — write-mode idempotency | 21-01 | 0 | EXP-01 (SC1) | — | Second write-mode run leaves `secondContents === firstContents` AND `secondStat.mtimeMs === firstStat.mtimeMs` on an unchanged entry, using freeform (non-5-H2) prose (review finding #1 — `--check` alone does not catch a rewrite-every-run script) | integration (execFileSync + stat in tmpdir) | `pnpm test` (`tests/scripts/sync-experience-idempotency.test.ts`) | ✅ | ✅ green |
| W0 — ordering helper | 21-01 | 0 | EXP-06 (SC3) | — | The REAL `sortExperienceEntries()` helper (`src/lib/experience.ts`) returns Holloway(2026) before Balfour(2023) on mock `{data:{startDate}}` entries — a reusable, Phase-22-consumable ordering contract, not a throwaway inline comparator (review finding #3, option a) | unit (no Astro runtime) | `pnpm test` (`tests/scripts/sync-experience.test.ts`) | ✅ | ✅ green |
| Impl — schema + collection | 21-02 | 1 | EXP-01 (SC2) | T-21-02 (input validation) | Typed frontmatter validated at build; Holloway (omitted `endDate`) + Balfour (empty `techStack`) pass Zod | build gate | `pnpm exec astro check` | ✅ (gate exists) | ✅ green (0 errors) |
| Impl — source-existence (pnpm test) | 21-03 | 2 | EXP-01 (SC1) | — | `pnpm test` asserts each `src/content/experience/*.mdx` `source:` file resolves via `access()` (review finding #5 — extends the project-only `tests/content/source-files-exist.test.ts`) | integration (readdir + access) | `pnpm test` (`tests/content/source-files-exist.test.ts`) | ✅ | ✅ green |
| Impl — build green / no new deps | 21-03 | 2 | EXP-01 (SC4) | — | `pnpm build` succeeds; `package.json` dependencies byte-identical | build gate + dep-diff | `pnpm build`; `git diff --exit-code package.json` | ✅ (gate) / ✅ CI dep-diff | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Build-gate vs bespoke-test split (from research):**
- **Build gate already covers:** SC2 typed-frontmatter validation (`astro check` runs Zod against every entry) and SC4 build-green. The two real entries double as optionality-edge fixtures — Holloway exercises omitted `endDate`, Balfour exercises empty `techStack`.
- **Needs a bespoke test:** SC1 sync idempotency/drift/hard-fail (mirror the two existing `sync-projects` test files) and SC3 ordering (comparator on mock entries).

---

## Wave 0 Requirements

- [x] `tests/scripts/sync-experience.test.ts` — unit tests for lifted `readSourceField` / `sliceFrontmatter` / `extractFence` / `normalize` + path-traversal integration asserting BOTH the `escapes project root` message AND captured `err.status === 2` (review finding #2). Mirror `tests/scripts/sync-projects.test.ts`. **(shipped 21-01, green)**
- [x] `tests/scripts/sync-experience-check.test.ts` — `--check` no-drift (exit 0) and drift (`status === 1`) integration. Mirror `tests/scripts/sync-projects-check.test.ts`. **(shipped 21-01, green)**
- [x] `tests/scripts/sync-experience-idempotency.test.ts` — write-mode idempotency: second run leaves contents + mtime unchanged, freeform (non-5-H2) prose (review finding #1). Mirror `tests/scripts/sync-projects-idempotency.test.ts`. **(shipped 21-01, green)**
- [x] Ordering unit test — imports and exercises the REAL `sortExperienceEntries()` helper (`src/lib/experience.ts`) for reverse-chron order (SC3 / EXP-06; review finding #3, option a). Lives in `sync-experience.test.ts`. **(shipped 21-01, green)**
- [x] (Optional) dep-diff assertion for SC4 — covered by CI `git diff --exit-code package.json` in `.github/workflows/sync-check.yml` (21-04); deps held at 11 runtime / 12 dev.

*Note (finding #5): `tests/content/source-files-exist.test.ts` gains an experience describe block in Plan 03 (Wave 2, once the two `.mdx` entries exist) so `pnpm test` — not only CI — asserts the experience `source:` files resolve. It is NOT a Wave 0 item because it depends on the authored entries.*

*Framework install: none — Vitest ^4.1.0 present and already running the `sync-projects` tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Holloway fenced body captures the intended deep-dive (A2 — fence starts right after H1, including the `> Contract engagement` blockquote) | EXP-01 | Authoring/placement judgment — a passing sync does not prove the *right* content was fenced | After first `pnpm sync:experience`, open `src/content/experience/holloway.mdx` and confirm the body opens with the "Contract engagement" lede and includes Overview → Highlights → Themes |

*All other phase behaviors have automated verification (Wave 0 tests + `astro check` / `pnpm build` gates).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s (suite runs in ~0.5s; 23 experience tests)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-09 — all 7 mapped requirements COVERED with green automated verification; 1 legitimate Manual-Only (A2 authoring judgment).

---

## Validation Audit 2026-07-09

State A audit: the pre-execution draft map was reconciled against the delivered artifacts (Plans 21-01 through 21-04). Every planned test file exists on disk and runs green; no gaps required the nyquist auditor.

| Metric | Count |
|--------|-------|
| Requirements mapped | 7 |
| Gaps found | 0 |
| Resolved (auditor) | 0 |
| Escalated to manual-only | 0 |
| Manual-only (pre-existing, legitimate) | 1 |

**Coverage verified this audit:**

| Test file / gate | Tests | Result |
|------------------|-------|--------|
| `tests/scripts/sync-experience.test.ts` (units + exit-2 path traversal + ordering) | — | ✅ green |
| `tests/scripts/sync-experience-check.test.ts` (`--check` exit 0/1 drift) | — | ✅ green |
| `tests/scripts/sync-experience-idempotency.test.ts` (contents + mtime unchanged) | — | ✅ green |
| `tests/content/source-files-exist.test.ts` (experience `source:` resolution) | — | ✅ green |
| Combined experience suite (`vitest run`) | 23 | ✅ 23 passed |
| `pnpm exec astro check` (SC2 typed-frontmatter Zod gate) | — | ✅ 0 errors, 0 warnings |
| CI drift gate `.github/workflows/sync-check.yml` + dep-diff (SC1/SC4) | — | ✅ wired (21-04) |

Result: **nyquist-compliant** — set `nyquist_compliant: true`, `wave_0_complete: true`, `status: validated`.
