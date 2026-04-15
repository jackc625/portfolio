---
phase: 11-polish
reviewed: 2026-04-14T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/styles/global.css
  - src/layouts/BaseLayout.astro
  - src/components/JsonLd.astro
  - src/components/primitives/Container.astro
  - src/components/primitives/WorkRow.astro
  - src/components/ContactSection.astro
  - src/components/primitives/Footer.astro
  - astro.config.mjs
  - CLAUDE.md
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the polish-phase touchpoints: editorial design tokens, shared layout chrome, SEO/JSON-LD, and the contact/footer primitives. Overall the code is tight, well-commented, and adheres consistently to the design-system constraints in `CLAUDE.md` (six hex tokens, primitives use scoped styles, focus rings use `--accent`, no Tailwind utilities inside primitive markup, etc.).

No security issues. No content-injection concerns — the single `set:html` in `JsonLd.astro` is gated by `Astro.props.schema` coming from build-time code, not user input, and is serialized through `JSON.stringify` which cannot produce tags (it HTML-escapes the embedded `<` as `\u003c` is not guaranteed, see WR-01 below for the edge case).

Two warnings are worth fixing before close-out: a latent JSON-LD script-injection hardening gap and an Astro conditional-fragment pattern in `ContactSection.astro` that is brittle. Info items are minor code-quality observations.

## Warnings

### WR-01: JSON-LD `set:html` does not escape `</script>` sequences in schema strings

**File:** `src/components/JsonLd.astro:8`
**Issue:** `JsonLd.astro` serializes the schema with `JSON.stringify(schema)` and injects it verbatim via `set:html` inside a `<script type="application/ld+json">` tag. `JSON.stringify` does NOT escape the literal character sequence `</` — so if any string value in the schema ever contains `</script>` (e.g., pulled from project MDX, a bio, or future user-editable content), the tag will close prematurely and the remainder of the JSON becomes inline HTML. This is a well-known JSON-in-HTML pitfall and a latent XSS vector once any schema string starts flowing from untrusted/contributor content.

Today every caller passes hand-authored constants, so the risk is low — but the component is generic and will be reused. Hardening it at the boundary is the correct place.

**Fix:**
```astro
---
interface Props {
  schema: Record<string, unknown>;
}
const { schema } = Astro.props;
// Escape </ and <! sequences that would terminate a <script> block or
// start an HTML comment. Also escape line/paragraph separators that
// break JavaScript string literals in older parsers.
const serialized = JSON.stringify(schema)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
---

<script is:inline type="application/ld+json" set:html={serialized} />
```

This still produces valid JSON-LD (Google's parser accepts `\uXXXX` escapes) and is robust against any future schema value containing `</script>`.

---

### WR-02: Adjacent elements inside conditional expression without a Fragment wrapper

**File:** `src/components/ContactSection.astro:26-29`
**Issue:** The conditional block returns two adjacent sibling `<div>` elements from a single `&&` expression:

```astro
{showSectionHeader && (
  <div class="section-header">...</div>
  <div class="section-rule"></div>
)}
```

In Astro's JSX-like expression syntax, an expression must evaluate to a single node (or a Fragment). Adjacent JSX siblings without a Fragment wrapper are a parse-time error in strict JSX and, while Astro's parser is sometimes lenient, this pattern is inconsistent with how the adjacent-sibling case is handled elsewhere in the codebase — see `Footer.astro:40-50` which correctly wraps two siblings in `<>...</>` inside a `.map()`.

Relying on parser leniency is brittle: if a future Astro minor version or a Prettier/eslint-plugin-astro pass re-formats this, the build may break or the second element may be dropped silently. It is also harder to read.

**Fix:**
```astro
{showSectionHeader && (
  <>
    <div class="section-header">
      <span id="section-contact" class="label-mono">&sect; 03 &mdash; CONTACT</span>
    </div>
    <div class="section-rule"></div>
  </>
)}
```

## Info

### IN-01: `Container.astro` uses an `eslint-disable` comment to silence an unused-props lint

**File:** `src/components/primitives/Container.astro:18-20`
**Issue:**
```astro
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- consumed by Astro's type system
const _props: Props = Astro.props;
const { as: Tag = "div", class: className } = _props;
```
The `_props` intermediate variable exists only to give `Props` a referent for type-checking. This works, but the idiomatic Astro pattern is to destructure directly from `Astro.props` with the type assertion inline, which removes the lint suppression entirely.

**Fix:**
```astro
const { as: Tag = "div", class: className } = Astro.props as Props;
```
Or, if you prefer the destructure-first style, `Astro.props` is already typed via the `Props` interface convention in Astro — the explicit annotation is redundant.

---

### IN-02: `BaseLayout.astro` fallback `siteUrl` duplicates the canonical constant

**File:** `src/layouts/BaseLayout.astro:29-30`
**Issue:**
```ts
const siteUrl =
  Astro.site?.toString().replace(/\/$/, "") ?? "https://jackcutrara.com";
```
The fallback literal `"https://jackcutrara.com"` duplicates `site` in `astro.config.mjs`. Since `site` is set unconditionally in the Astro config, `Astro.site` will always be defined at build time and the `??` fallback is dead code. Either (a) drop the fallback and let TypeScript narrow `Astro.site` to non-null via a build-time assertion, or (b) centralize the URL in a shared constants file so the two sources cannot drift.

**Fix:** Drop the fallback — the regex also becomes unnecessary if you rely on a single trailing-slash-stripped constant:
```ts
const siteUrl = Astro.site!.toString().replace(/\/$/, "");
```

---

### IN-03: Tailwind `@theme` block and `@theme inline` block duplicate font tokens

**File:** `src/styles/global.css:58-67`
**Issue:** `--font-display`, `--font-body`, and `--font-mono` are defined identically inside both `@theme { ... }` (lines 58-60) and `@theme inline { ... }` (lines 64-66). Tailwind v4's `@theme inline` directive re-exports the variable at its current value (for use in authored CSS), whereas `@theme` emits the utility class. Duplicating both is occasionally necessary, but there is no explanatory comment here — a future reader will not know why both blocks exist and may consolidate them incorrectly.

**Fix:** Add a one-line comment above `@theme inline` explaining it exists so authored CSS can reference `var(--font-display)` etc. directly, and cross-reference the Tailwind v4 docs note. If neither authored CSS nor any component does this, remove the `@theme inline` block.

---

### IN-04: `ogType` prop is typed as `string` but should be a union

**File:** `src/layouts/BaseLayout.astro:15`
**Issue:**
```ts
ogType?: string;
```
`astro-seo` / Open Graph `og:type` accepts a finite set of values (`website`, `article`, `profile`, `book`, `video.movie`, etc.). Typing it as `string` allows typos like `ogType="artical"` to ship silently.

**Fix:**
```ts
ogType?: "website" | "article" | "profile" | "book" | "video.movie";
```
Or at minimum `"website" | "article" | "profile"` given the portfolio's actual usage.

---

_Reviewed: 2026-04-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
