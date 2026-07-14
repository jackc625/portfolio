---
phase: 24-positioning-shift-home-teaser
reviewed: 2026-07-14T12:32:37Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - scripts/generate-og-card.mjs
  - scripts/verify-phase24-invariants.mjs
  - scripts/verify-phase24-og.mjs
  - src/components/ContactSection.astro
  - src/data/about.ts
  - src/data/education.ts
  - src/pages/about.astro
  - src/pages/index.astro
  - tests/build/about-education-render.test.ts
  - tests/build/chat-surface-untouched.test.ts
  - tests/build/home-teaser-render.test.ts
  - tests/content/education-module.test.ts
  - tests/content/site-copy-em-dash.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-07-14T12:32:37Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 24 (positioning shift + Home Holloway teaser + education SSoT + OG card generator/verifiers) is well-constructed. I verified the load-bearing claims against ground truth rather than trusting the annotations:

- Both em-dash gates target the correct codepoint. `site-copy-em-dash.test.ts` and the `EM_DASH` literal in `home-teaser-render.test.ts` are genuinely U+2014 (confirmed by codepoint dump), and all five scanned copy surfaces (`about.ts`, `education.ts`, `index.astro`, `about.astro`, `ContactSection.astro`) contain zero U+2014 and zero U+2013. The gate is effective, not a no-op.
- The register banlist (`\bjunior\b`, `\bsenior\b`, `\b5\+\s*years\b`) has no false positives. In particular "seniority" in the `about.ts` header comment does not match `\bsenior\b` (no trailing word boundary), so the gate stays green legitimately.
- The Home-teaser render gate is consistent with the implementation: `holloway.mdx` supplies `role: "Software Engineer, Contract"`, `company: "Holloway Company"`, `dateRange: "May 2026 – Present"`, and a `~1,400` highlight, all of which the test asserts and `index.astro` renders. No test/impl disagreement.
- `education.ts` is a real single source of truth: `alumniOfSchema` / `hasCredentialSchema` are derived from `EDUCATION`/`CREDENTIALS`, VT is alumniOf-only and never a credential, and the derivation unit gate proves it. `JsonLd.astro` escaping of the derived schema is sound.
- The hardcoded font files referenced by the OG generator currently exist in `.astro/fonts/`.

No security vulnerabilities, data-loss risks, or crashes-in-normal-operation were found. Zero new runtime dependencies were introduced (QA-02 holds). The findings below are robustness/maintainability concerns in the build-time verifier and generator scripts, plus minor test-strength and a11y nits. None block shipping.

## Warnings

### WR-01: Dependency invariant check is key-order-sensitive (false-positive risk at the capstone gate)

**File:** `scripts/verify-phase24-invariants.mjs:94-100`
**Issue:** The no-new-deps invariant compares `JSON.stringify(currentDependencies())` against `JSON.stringify(baseline.dependencies)`. `JSON.stringify` serializes object keys in insertion order, so a benign reordering of the `dependencies` block in `package.json` (e.g., an alphabetize-on-save formatter, or a tooling rewrite) with no additions or removals will produce a different string and trip `package.json dependencies changed (QA-02 no-new-deps)`. The intent (QA-02 / D-19) is to detect *added* dependencies, not reordering, but this is the authoritative phase gate — a false positive here erroneously fails the 24-04 capstone.
**Fix:** Normalize before comparing, e.g. compare sorted key sets and per-key values:
```js
const norm = (deps) =>
  JSON.stringify(Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))));
if (norm(currentDependencies()) !== norm(baseline.dependencies ?? {})) { /* mismatch */ }
```

### WR-02: OG generator hardcodes content-hashed font filenames and the `.astro/fonts` path with no guard

**File:** `scripts/generate-og-card.mjs:22-35`
**Issue:** `FONTS` pins exact Astro Fonts API output names (e.g. `font-display-src-700-normal-latin-502b9851e13aed9b.woff2`) and `fontsDir` assumes `.astro/fonts` exists. Astro emits multiple content-hash variants per weight (the directory currently holds both `...502b9851e13aed9b.woff2` and `...90b0f702c953406a.woff2` for body/display, and two mono hashes), and those hashes change whenever the font set/config changes. Any font/config change, or running the generator before a build populates `.astro/fonts`, makes `readFileSync` throw an opaque `ENOENT` with no hint that the pinned hash went stale. The committed `public/og-default.png` and its verifier are unaffected, so this fails silently only when someone regenerates the card.
**Fix:** Resolve each face by stable prefix instead of full hash, and fail with a clear message:
```js
import { readdirSync } from "node:fs";
function findFont(prefix) {
  const hit = readdirSync(fontsDir).find((f) => f.startsWith(prefix) && f.endsWith(".woff2"));
  if (!hit) throw new Error(`OG generator: no woff2 matching "${prefix}" in ${fontsDir} (run a build first?)`);
  return hit;
}
// e.g. findFont("font-display-src-700-normal-latin-")
```

### WR-03: OG/invariant verifiers throw opaquely on truncated or missing inputs instead of reporting a clean failure

**File:** `scripts/verify-phase24-og.mjs:56-57` (and `scripts/verify-phase24-invariants.mjs:86`)
**Issue:** In the OG verifier, `buf.readUInt32BE(16)` / `readUInt32BE(20)` run unconditionally even after the PNG-signature check has already pushed a failure. If `public/og-default.png` is truncated or corrupt (fewer than 24 bytes), these calls throw an uncaught `RangeError`, bypassing the documented `{ ok, failures }` contract and emitting a raw stack trace instead of the intended human-readable failure list. Likewise, `verify-phase24-invariants.mjs` calls `sha256File(rel)` for every protected file; if a protected file is *deleted*, `readFileSync` throws `ENOENT` rather than reporting a clean "protected file missing/drifted" mismatch. The process still exits nonzero, but the diagnostic is opaque.
**Fix:** Short-circuit after the signature failure and length-guard the reads; wrap `sha256File` in a try/catch that converts I/O errors into a `mismatches`/`failures` entry:
```js
if (buf.length < 24) { failures.push(`file too small (${buf.length} bytes) to be a valid PNG`); return { ok: false, failures }; }
```

## Info

### IN-01: Home-teaser "no tech-stack line" assertion cannot catch a regression

**File:** `tests/build/home-teaser-render.test.ts:91`
**Issue:** The D-05 "ZERO tech-stack line" guard asserts `sec.querySelectorAll(".featured-stack, .teaser-stack").length` is `0`. The teaser in `index.astro` never emits either class, so this assertion passes vacuously and would still pass if a stack line were reintroduced under any other markup/class. The gate does not actually enforce its stated invariant.
**Fix:** Assert against what a reintroduced stack would look like, e.g. that the teaser text does not contain a known stack token (`expect(norm(sec.textContent)).not.toContain("TypeScript")`) or that the teaser contains no `<ul>`/element carrying the tech list beyond the single highlight.

### IN-02: `aria-labelledby` on a roleless `<div>` is inert for assistive tech

**File:** `src/pages/about.astro:20-21`
**Issue:** The education block is `<div class="education" aria-labelledby="education-label">` with the label supplied by a `<p id="education-label">`. `aria-labelledby` only contributes an accessible name to elements with a role that supports naming; a generic `<div>` has no such role, so screen readers ignore the association and the block is not exposed as a named region.
**Fix:** Either add `role="region"` to make it a named landmark, or promote the label to a real heading inside the section's hierarchy and drop the `aria-labelledby` on the div.

### IN-03: Inconsistent apostrophe/quote convention between copy sources

**File:** `src/data/about.ts:16` (and `20`, `24`) vs `src/pages/index.astro:96`
**Issue:** `about.ts` uses literal smart punctuation (U+2019 apostrophes, U+201C/U+201D quotes) directly in the exported strings, while `index.astro` renders the same voice using HTML entities (`I&rsquo;m`). Both render correctly, but the mixed convention across sibling copy surfaces is an inconsistency that invites future divergence and makes grep-based copy audits harder.
**Fix:** Pick one convention for authored copy (recommend literal Unicode in the `src/data/*` SSoT modules, since those are the canonical source) and apply it consistently.

---

_Reviewed: 2026-07-14T12:32:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
