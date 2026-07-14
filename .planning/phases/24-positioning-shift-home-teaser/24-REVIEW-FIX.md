---
phase: 24-positioning-shift-home-teaser
fixed_at: 2026-07-14T08:52:00Z
review_path: .planning/phases/24-positioning-shift-home-teaser/24-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 24: Code Review Fix Report

**Fixed at:** 2026-07-14T08:52:00Z
**Source review:** .planning/phases/24-positioning-shift-home-teaser/24-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (3 warning + 3 info, fix_scope=all)
- Fixed: 6
- Skipped: 0

**Gate results (all GREEN):**
- `pnpm test` — 677 passed / 2 skipped (0 failures)
- `pnpm exec astro check` — 0 errors / 0 warnings / 0 hints
- `node scripts/verify-phase24-og.mjs` — exit 0
- `node scripts/verify-phase24-invariants.mjs` — exit 0

## Fixed Issues

### WR-01: Dependency invariant check is key-order-sensitive

**Files modified:** `scripts/verify-phase24-invariants.mjs`
**Commit:** 57821a2 (shared with WR-03; see note below)
**Applied fix:** Added a `normDeps` helper that sorts `dependencies` entries by key before `JSON.stringify`, and compared the normalized current object against the normalized baseline. A benign reorder of the `package.json` dependencies block (formatter/tooling rewrite) with no additions or removals no longer trips the QA-02 no-new-deps invariant; genuine additions/removals still fail. Current deps already match the baseline, so the verifier still exits 0.

### WR-02: OG generator hardcodes content-hashed font filenames

**Files modified:** `scripts/generate-og-card.mjs`
**Commit:** 26f7439
**Applied fix:** Replaced the three pinned content-hash `.woff2` filenames with a `findFont(prefix)` resolver that `readdirSync`s `.astro/fonts` and matches each face by its stable Astro Fonts API prefix (`font-display-src-700-normal-latin-`, `font-body-src-400-normal-latin-`, `font-mono-src-400-normal-latin-`). Throws a clear, actionable error ("run a build first?") if the dir is unreadable or no matching woff2 exists, instead of an opaque `ENOENT`. Did NOT run the generator, regenerate `public/og-default.png`, or touch `scripts/og-card.html` — source robustness only. Verified prefixes resolve against the current font set (`node --check` passes; each prefix has a matching file on disk).

### WR-03: OG/invariant verifiers throw opaquely on truncated or missing inputs

**Files modified:** `scripts/verify-phase24-og.mjs`, `scripts/verify-phase24-invariants.mjs`
**Commit:** 15837e7 (og verifier), 57821a2 (invariant verifier)
**Applied fix:** In `verify-phase24-og.mjs`, added a `buf.length < 24` length guard that pushes a clean `file too small` failure and returns `{ ok: false, failures }` before the unconditional `readUInt32BE(16/20)` calls, so a truncated PNG yields the documented failure contract rather than an uncaught `RangeError`. In `verify-phase24-invariants.mjs`, wrapped the per-file `sha256File(rel)` call in try/catch that converts I/O errors (e.g. a deleted protected file) into a clean `protected file missing or unreadable` mismatch entry and continues. Both verifiers still exit 0 on the current valid inputs.

### IN-01: Home-teaser "no tech-stack line" assertion cannot catch a regression

**Files modified:** `tests/build/home-teaser-render.test.ts`
**Commit:** 630bffa
**Applied fix:** Kept the existing `.featured-stack, .teaser-stack` class assertion and added a text-level guard: the normalized teaser `textContent` must not contain any known stack token (`TypeScript`, `React`, `Astro`, `Node`, `Postgres`, `Tailwind`), each with a descriptive failure message. A reintroduced stack line under any markup/class is now caught, not just those two classes. The strengthened assertion passes against the current teaser (which carries no stack tokens) — confirmed by the full suite staying green.

### IN-02: aria-labelledby on a roleless div is inert for assistive tech

**Files modified:** `src/pages/about.astro`
**Commit:** 709f7cb
**Applied fix:** Added `role="region"` to the education `<div class="education" aria-labelledby="education-label">` so the existing `aria-labelledby` gains a role that supports naming, exposing the block as a named region to screen readers. Used the non-visual fix only — no heading promotion, no structural or visual change (design decisions out of scope for an a11y fix). `astro check` remains 0/0/0.

### IN-03: Inconsistent apostrophe/quote convention between copy sources

**Files modified:** `src/pages/index.astro`
**Commit:** d0976a3
**Applied fix:** Normalized the home-teaser summary's HTML-entity smart apostrophe `I&rsquo;m` to literal Unicode `I’m` (U+2019), matching the `src/data/*` SSoT convention (which already uses literal smart punctuation). Confirmed no test asserts the raw entity form (grep of tests found only the already-literal `about.ts`), so no gate breaks. Rendered DOM output is unchanged (both forms produce U+2019). Verified the inserted character is U+2019 and introduces no U+2014 em dash. Intentional glyph entities (`&middot;`, `&rarr;`, `&sect;`) were deliberately left untouched — the convention applies to apostrophes/quotes only.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-14T08:52:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
