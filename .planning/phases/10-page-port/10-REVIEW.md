---
phase: 10-page-port
reviewed: 2026-04-12T12:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - astro.config.mjs
  - design-system/MASTER.md
  - src/components/ContactSection.astro
  - src/components/chat/ChatWidget.astro
  - src/components/primitives/Footer.astro
  - src/components/primitives/MobileMenu.astro
  - src/content.config.ts
  - src/content/projects/clipify.mdx
  - src/content/projects/crypto-breakout-trader.mdx
  - src/content/projects/nfl-predict.mdx
  - src/content/projects/optimize-ai.mdx
  - src/content/projects/seatwatch.mdx
  - src/content/projects/solsniper.mdx
  - src/data/about.ts
  - src/data/contact.ts
  - src/pages/about.astro
  - src/pages/contact.astro
  - src/pages/index.astro
  - src/pages/projects.astro
  - src/pages/projects/[id].astro
  - src/scripts/chat.ts
  - src/styles/global.css
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-12T12:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the full Phase 10 page port: Astro config, content collections, data modules, all page templates (index, about, contact, projects, project detail), shared components (ContactSection, Footer, MobileMenu, ChatWidget), the chat client-side controller, and the global stylesheet.

Overall the codebase is well-structured. Data is centralized in `src/data/`, content uses typed Zod schemas, components follow a clear primitives-vs-composites pattern, and security-sensitive areas (markdown rendering, chat input) are handled properly with DOMPurify sanitization. The main issues are broken `aria-labelledby` references across multiple pages, a non-null assertion on a potentially null response body in the chat streaming code, and minor dead/duplicate code.

## Warnings

### WR-01: Broken aria-labelledby references on multiple pages

**File:** `src/pages/index.astro:58`, `src/pages/index.astro:75`, `src/pages/index.astro:86`, `src/pages/about.astro:9`, `src/pages/projects.astro:15`
**Issue:** Five `<section>` elements use `aria-labelledby` pointing to IDs that do not exist in the DOM. For example, `aria-labelledby="section-work"`, `aria-labelledby="section-about"`, and `aria-labelledby="section-contact"` are referenced, but `SectionHeader.astro` does not render any element with a matching `id` attribute. The `SectionHeader` component renders `<div class="section-header"><span class="label-mono section-label">...</span></div>` with no `id` on any element. This means screen readers cannot resolve the labelled-by relationship, and the sections effectively have no accessible name from `aria-labelledby`. This is an accessibility bug that violates WCAG 1.3.1 (Info and Relationships).
**Fix:** Add an `id` prop to `SectionHeader.astro` and render it on the label span:

In `src/components/primitives/SectionHeader.astro`:
```astro
---
interface Props {
  number: string;
  title: string;
  count?: string;
  id?: string;
}
const { number, title, count, id } = Astro.props;
---
<div class="section-header">
  <span id={id} class="label-mono section-label">{'\u00A7'} {number} {'\u2014'} {title}</span>
  {count && <span class="meta-mono tabular section-count">{count}</span>}
</div>
<div class="section-rule"></div>
```

Then in consuming pages, pass the `id`:
```astro
<SectionHeader number="01" title="WORK" id="section-work" count={...} />
```

### WR-02: Non-null assertion on response.body in chat streaming

**File:** `src/scripts/chat.ts:168`
**Issue:** `response.body!.getReader()` uses a TypeScript non-null assertion. While `response.body` is almost always non-null for streaming responses, the Fetch API spec allows it to be `null` (e.g., for empty responses, certain redirect responses, or opaque responses). If the server returns an empty 200 with no body, this will throw a runtime TypeError ("Cannot read properties of null"), crashing the chat and leaving the UI stuck in the "typing" state with input disabled.
**Fix:** Add a null guard before accessing the reader:
```typescript
if (!response.body) {
  onError("api_error");
  return;
}
const reader = response.body.getReader();
```

### WR-03: Duplicate conditional branches in updateCharCount

**File:** `src/scripts/chat.ts:632-638`
**Issue:** The `if (len >= 500)` and `else if (len > 450)` branches execute identical code (both set `color` to `var(--accent)` and `fontWeight` to `"600"`). This is dead logic -- the two branches should either be collapsed or the first branch should have distinct styling (e.g., a different color or a warning indicator at the max limit). As written, there is no visual distinction between "approaching limit" and "at limit", which is a UX gap.
**Fix:** Collapse into a single condition, or differentiate the "at max" state:
```typescript
if (len >= 500) {
  // At max -- could use a stronger signal (e.g., bold + different color)
  $charCount.style.color = "var(--accent)";
  $charCount.style.fontWeight = "700";
} else if (len > 450) {
  // Approaching limit
  $charCount.style.color = "var(--accent)";
  $charCount.style.fontWeight = "600";
} else {
  $charCount.style.color = "var(--ink-faint)";
  $charCount.style.fontWeight = "400";
}
```

## Info

### IN-01: Duplicate font registration in Astro config

**File:** `astro.config.mjs:28-43`
**Issue:** The `fonts` array registers the exact same font ("Geist", weights 400/500/600/700, normal style, identical fallbacks) twice under different CSS variable names (`--font-display-src` and `--font-body-src`). Since both display and body use the same Geist font, this causes the Astro Fonts API to process and potentially download the font definition twice at build time. While functionally correct, it adds unnecessary build overhead.
**Fix:** Consider registering Geist once and aliasing the second variable in CSS:
```css
:root {
  --font-body-src: var(--font-display-src);
}
```
Then remove the second font entry from `astro.config.mjs`. Alternatively, keep it as-is if you anticipate switching body to a different font in the future -- the current setup makes that a one-line change.

### IN-02: Redundant role="button" on button elements in ChatWidget

**File:** `src/components/chat/ChatWidget.astro:91`, `src/components/chat/ChatWidget.astro:97`, `src/components/chat/ChatWidget.astro:103`, `src/components/chat/ChatWidget.astro:109`
**Issue:** The starter chip `<button>` elements have `role="button"` explicitly set, but native `<button>` elements already have an implicit ARIA role of "button". The redundant attribute is harmless but unnecessary.
**Fix:** Remove `role="button"` from the four `<button type="button" class="chat-starter-chip">` elements.

### IN-03: Redundant tabindex="0" on button elements in ChatWidget

**File:** `src/components/chat/ChatWidget.astro:92`, `src/components/chat/ChatWidget.astro:98`, `src/components/chat/ChatWidget.astro:104`, `src/components/chat/ChatWidget.astro:110`
**Issue:** The starter chip `<button>` elements have `tabindex="0"`, but native `<button>` elements are already in the tab order by default. The attribute is redundant.
**Fix:** Remove `tabindex="0"` from the four starter chip buttons.

### IN-04: Duplicate @theme font declarations in global.css

**File:** `src/styles/global.css:39-65`
**Issue:** The font-family variables (`--font-display`, `--font-body`, `--font-mono`) are declared identically in both the `@theme` block (lines 56-58) and the `@theme inline` block (lines 62-64). In Tailwind v4, `@theme inline` is used to make tokens available without generating utility classes. Having the same values in both `@theme` and `@theme inline` means the font values are processed twice. The `@theme inline` block should be the canonical location if the intent is to prevent font utilities from being generated; the duplicates in the main `@theme` block should then be removed. If font utilities (like `font-display`) are desired, then the `@theme inline` block is the redundant one.
**Fix:** Remove the font declarations from one of the two blocks. If `font-display` / `font-body` / `font-mono` Tailwind utilities are used in templates, keep them in `@theme` and remove the `@theme inline` block. If not, move them exclusively to `@theme inline`.

---

_Reviewed: 2026-04-12T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
