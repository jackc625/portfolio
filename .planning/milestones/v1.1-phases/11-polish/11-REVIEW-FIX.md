---
phase: 11-polish
fixed_at: 2026-04-14T00:00:00Z
review_path: .planning/phases/11-polish/11-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-04-14T00:00:00Z
**Source review:** .planning/phases/11-polish/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (critical + warning)
- Fixed: 2
- Skipped: 0

Info findings (IN-01 through IN-04) were out of scope for this fix pass (`fix_scope: critical_warning`) and remain untouched.

## Fixed Issues

### WR-01: JSON-LD `set:html` does not escape `</script>` sequences in schema strings

**Files modified:** `src/components/JsonLd.astro`
**Commit:** 369a2b4
**Applied fix:** Replaced the inline `JSON.stringify(schema)` call with a serialized intermediate that escapes `<`, `>`, `&`, U+2028, and U+2029 as `\uXXXX` escapes before handing the string to `set:html`. This closes the latent script-tag injection vector if any future schema string contains `</script>` or `<!--`, while remaining valid JSON-LD (Google's parser accepts `\uXXXX` escapes). An explanatory comment documents the intent for future readers.

### WR-02: Adjacent elements inside conditional expression without a Fragment wrapper

**Files modified:** `src/components/ContactSection.astro`
**Commit:** b36fbf4
**Applied fix:** Wrapped the two adjacent `<div>` siblings (`.section-header` and `.section-rule`) inside the `{showSectionHeader && ( ... )}` conditional in an Astro Fragment (`<> ... </>`). This brings the block in line with the pattern already used in `Footer.astro:40-50` and removes reliance on Astro parser leniency for adjacent-sibling JSX expressions. No visual or behavioral change — the rendered output is identical.

---

_Fixed: 2026-04-14T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
