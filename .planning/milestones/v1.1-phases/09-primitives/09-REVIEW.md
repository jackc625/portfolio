---
phase: 09-primitives
reviewed: 2026-04-08T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - astro.config.mjs
  - public/robots.txt
  - src/components/NextProject.astro
  - src/components/primitives/Container.astro
  - src/components/primitives/Footer.astro
  - src/components/primitives/Header.astro
  - src/components/primitives/MetaLabel.astro
  - src/components/primitives/MobileMenu.astro
  - src/components/primitives/SectionHeader.astro
  - src/components/primitives/StatusDot.astro
  - src/components/primitives/WorkRow.astro
  - src/layouts/BaseLayout.astro
  - src/pages/dev/primitives.astro
  - src/styles/global.css
findings:
  critical: 0
  warning: 5
  info: 6
  total: 11
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-04-08
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 9 ships a well-structured editorial primitive library. The code is disciplined: no Tailwind utility classes in primitive markup (D-03), no new color tokens (D-16), no JS animation libraries, and the MobileMenu focus trap faithfully mirrors the `src/scripts/chat.ts setupFocusTrap` pattern per D-08. All imports resolve, TypeScript props are strictly typed, and no security vulnerabilities (XSS, injection, hardcoded secrets) were found.

The findings below are real correctness and a11y issues, not style nitpicks:

1. **A11y gaps in the modal dialog and keyboard navigation** — the dialog trap is only edge-guarded, header focus styles are missing, and `prefers-reduced-motion` is not honored for `scroll-behavior: smooth`.
2. **Two defensive-coding bugs in `BaseLayout.astro` and `src/pages/dev/primitives.astro`** — the OG image URL builder corrupts already-absolute URLs, and the dev preview `previewYears` array can feed `undefined` into a typed string prop.
3. **Minor props-typing and housekeeping issues** flagged as Info.

No Critical issues. 5 Warnings (fix before Phase 10 consumes the primitives), 6 Info items (clean-up in Phase 10 or when touching the file).

## Warnings

### WR-01: Mobile menu focus trap only catches first↔last; rest of page remains in tab order

**File:** `src/components/primitives/MobileMenu.astro:279-303`
**Issue:** The `handleKeyDown` trap re-queries focusables on every Tab (good), but only intercepts Tab when `document.activeElement === first` (Shift+Tab) or `=== last` (Tab). While the menu is open, the Header, main, Footer, and ChatWidget elements behind the backdrop are still visually obscured but remain in the DOM's tab order and the accessibility tree. If a keyboard user tabs off a middle element directly into a still-focusable header link (for example via a screen-reader quick-key or VoiceOver rotor), focus leaves the dialog silently and the trap only re-engages when the user tabs back in. This is a real modal-dialog a11y bug.

The chat widget at `src/scripts/chat.ts:324` uses the same trap shape, but chat attaches the handler to `panel.addEventListener("keydown", handler)` on the panel element itself — not `document`. That scoping means chat's trap only fires when focus is already inside the panel, which masks the same defect in a different way. MobileMenu attaches to `document`, so the defect is visible here.

**Fix:** Either (a) add the HTML `inert` attribute to `<header>`, `<main>`, and `<footer>` while the menu is open so the rest of the page is removed from the tab order and a11y tree, or (b) check inside `handleKeyDown` whether `document.activeElement` is still contained in `menu` and, if not, reset focus into the dialog.

```ts
// Option (a) — simpler, preferred
function openMenu() {
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");
  trigger!.setAttribute("aria-expanded", "true");
  trigger!.setAttribute("aria-label", "Close menu");
  document.body.style.overflow = "hidden";
  // Make the rest of the page inert while dialog is open
  document.querySelector("header")?.setAttribute("inert", "");
  document.querySelector("main")?.setAttribute("inert", "");
  document.querySelector("footer")?.setAttribute("inert", "");
  closeBtn!.focus();
  document.addEventListener("keydown", handleKeyDown);
}

function closeMenu(returnFocus = true) {
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  trigger!.setAttribute("aria-expanded", "false");
  trigger!.setAttribute("aria-label", "Open menu");
  document.body.style.overflow = "";
  document.querySelector("header")?.removeAttribute("inert");
  document.querySelector("main")?.removeAttribute("inert");
  document.querySelector("footer")?.removeAttribute("inert");
  document.removeEventListener("keydown", handleKeyDown);
  if (returnFocus) trigger!.focus();
}
```

`inert` has 95%+ browser support in 2026 and is the canonical modal-dialog pattern.

### WR-02: `prefers-reduced-motion` not honored for `scroll-behavior: smooth`

**File:** `src/styles/global.css:71-73`
**Issue:** `html { scroll-behavior: smooth; }` is applied unconditionally. Users who have set OS-level "reduce motion" (WCAG 2.3.3 / vestibular safety) still get programmatic smooth scrolls on in-page anchor navigation. The file already has a `prefers-reduced-motion` guard on `.nav-link-hover` (lines 100-107), so the intent exists — this rule was just missed.

**Fix:**
```css
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

### WR-03: `BaseLayout` OG image URL builder corrupts already-absolute URLs

**File:** `src/layouts/BaseLayout.astro:22, 49, 67`
**Issue:** `ogImage` defaults to `"/og-default.png"` and is then concatenated as `${siteUrl}${ogImage}`. If a future page passes an already-absolute URL (e.g., an external CDN OG image: `ogImage="https://cdn.example.com/hero.png"`), the output becomes `https://jackcutrara.comhttps://cdn.example.com/hero.png` — a broken URL that social crawlers will fail to fetch, silently degrading link previews.

The current Phase 9 call sites do not pass absolute URLs, so there is no visible breakage today, but the bug is latent and cheap to fix. Since `ogImage` has no JSDoc documenting the "must be root-relative" contract, a future caller is likely to hit this.

**Fix:**
```ts
const resolveOg = (img: string) =>
  /^https?:\/\//i.test(img) ? img : `${siteUrl}${img}`;

// ...then in the SEO component:
image: `${siteUrl}${ogImage}`,   // <- replace with resolveOg(ogImage)
// and twitter image: same replacement
```

### WR-4: `previewYears` can feed `undefined` into a typed `year: string` prop

**File:** `src/pages/dev/primitives.astro:29-33, 113-126`
**Issue:** `previewYears` is a hardcoded length-4 array. Projects are loaded via `(await getCollection("projects")).sort(...).slice(0, 4)`. If the content collection ever has fewer than 4 projects (e.g., during a content drop, or in early Phase 10 when projects are swapped), `previewYears[i]` for indices beyond the content count returns `undefined`, which is then passed to `<WorkRow year={previewYears[i]} />`. `WorkRow.astro:22` types `year: string`, so this is a silent type-violation at runtime — `{year}` in the template will render the string "undefined" in the DOM.

**Fix:** Either guard at the `.map` level with `previewYears[i] ?? ""` or change the array to be zipped with projects so it always has matching length:

```ts
// Safer: zip years into the projects derivation
const projects = (await getCollection("projects"))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 4)
  .map((p, i) => ({ project: p, year: ["2026", "2025", "2025", "2024"][i] ?? "2024" }));
```

And update the `.map` consumer to read `year` off each element. Quick-fix alternative: `year={previewYears[i] ?? "2024"}`.

### WR-5: `.menu-trigger`, `.nav-link`, and `.wordmark` have no focus-visible outline

**File:** `src/components/primitives/Header.astro:92-162`
**Issue:** The scoped stylesheet in `Header.astro` defines hover and active states for `.nav-link`, `.wordmark`, and `.menu-trigger`, but no `:focus-visible` rule. There is also no global `:focus-visible` reset in `src/styles/global.css`. Keyboard users tabbing through the header get only the browser's default focus ring, which many browsers render as a thin dotted line (or nothing at all after modern resets). By contrast, `NextProject.astro:91-94`, `MobileMenu.astro:161-164`, and the body `:focus-visible` patterns elsewhere all define explicit `outline: 2px solid var(--accent)`. This is an inconsistency, not just a style gap: the header is the most-tabbed region on every page and currently has the weakest focus affordance.

**Fix:** Add the same 2px accent outline pattern already used by `NextProject` and `MobileMenu`:

```css
.wordmark:focus-visible,
.nav-link:focus-visible,
.menu-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 2px;
}
```

## Info

### IN-01: `Container` component `as?: keyof HTMLElementTagNameMap` is over-permissive

**File:** `src/components/primitives/Container.astro:14-19`
**Issue:** `as?: keyof HTMLElementTagNameMap` accepts any HTML tag name, including void elements (`"img"`, `"input"`, `"br"`, `"hr"`, `"meta"`) which cannot contain children. The component always renders a `<slot />` inside the tag. Passing `as="img"` compiles but produces invalid HTML. No current call site does this, but the type signature does not prevent it.
**Fix:** Narrow the type to the valid container elements:
```ts
type ContainerTag = "div" | "main" | "section" | "article" | "nav" | "aside" | "header" | "footer";
interface Props {
  as?: ContainerTag;
  class?: string;
}
```

### IN-02: `Footer.astro` `link.href.startsWith("http")` check repeats inline

**File:** `src/components/primitives/Footer.astro:42-43` and `src/components/primitives/MobileMenu.astro:101-102`
**Issue:** The same "http?:// → external target/rel" logic is duplicated in `Footer` and `MobileMenu`. Extract once if a third consumer arrives in Phase 10.
**Fix:** Hoist a helper (either a small TS util or a Zod-typed `socialLinks` schema in a content collection) to own the external-link classification. Defer until the third copy appears — currently just a watchlist item.

### IN-03: `astro:page-load` listener in `MobileMenu.astro` may re-run `initMobileMenu` once per navigation

**File:** `src/components/primitives/MobileMenu.astro:356`
**Issue:** The script registers `document.addEventListener("astro:page-load", initMobileMenu)`. Astro module scripts hoist and dedupe, so this listener is added once per session — not once per navigation — so no listener leak. `initMobileMenu` is also idempotent for listener binding via the `menuInitialized` dataset guard. However, the unconditional `resetMobileMenuState` call inside it clobbers `document.body.style.overflow = ""` on every navigation. If Phase 10 introduces a non-menu modal that sets `body.overflow = "hidden"` during a View Transitions navigation, the mobile menu's reset may inadvertently clear it.
**Fix:** Scope the reset to "only when the menu is open" to avoid side effects on unrelated body-overflow users:
```ts
function resetMobileMenuState(menu: HTMLElement) {
  const trigger = document.getElementById("menu-trigger");
  const wasOpen = menu.classList.contains("is-open");
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  if (trigger) {
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Open menu");
  }
  if (wasOpen) document.body.style.overflow = "";
}
```

### IN-04: `aria-modal="true"` + `aria-hidden="true"` coexist on initial render

**File:** `src/components/primitives/MobileMenu.astro:57-64`
**Issue:** On initial SSR output, the dialog has both `aria-modal="true"` and `aria-hidden="true"`. Per ARIA authoring practices, the two are contradictory when coexistent: a hidden element cannot also be a modal. Because the element is `display: none` by default, screen readers ignore both attributes, so there is no observable bug. Still, cleaner to drop `aria-modal` until the dialog is actually open, then toggle it alongside `aria-hidden`.
**Fix:** Remove `aria-modal="true"` from the static markup and add it inside `openMenu()`:
```ts
menu.setAttribute("aria-modal", "true");
// ...and in closeMenu()
menu.removeAttribute("aria-modal");
```

### IN-05: `WorkRow` `<a>` has no focus-visible outline on the row itself

**File:** `src/components/primitives/WorkRow.astro:41-99`
**Issue:** On keyboard focus, `.work-row` reveals the arrow and underlines the title (good), but there is no outline around the row itself. Users who tab past and miss the subtle underline have no ring-shaped focus indicator. Browser default rings will apply since no global reset kills them, but on a polished portfolio this is worth hardening.
**Fix:**
```css
.work-row:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
```

### IN-06: Print stylesheet uses a hardcoded `#666` hex outside the 6-token palette

**File:** `src/styles/global.css:174`
**Issue:** `a[href^="http"]::after { color: #666; }` introduces a 7th color value in a codebase that intentionally locks the palette to six tokens per D-16. The rule is print-only so it is effectively invisible, but it breaks the "grep for hex values to audit palette compliance" workflow.
**Fix:** Since `var(--ink-faint)` (`#A1A1AA`) is too light for print legibility, introduce a print-only token at the top of `@media print`:
```css
@media print {
  :root {
    --print-meta: #666;
  }
  a[href^="http"]::after {
    color: var(--print-meta);
  }
}
```
This keeps the hex value scoped to the print block and documents intent.

---

_Reviewed: 2026-04-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
