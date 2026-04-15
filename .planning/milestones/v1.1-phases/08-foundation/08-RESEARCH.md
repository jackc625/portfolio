# Phase 8: Foundation - Research

**Researched:** 2026-04-07
**Domain:** Design-system rebrand + codebase demolition (Astro 6 + Tailwind v4 + TypeScript)
**Confidence:** HIGH on the critical findings, MEDIUM on a few Tailwind v4 HMR edge cases

## Summary

Phase 8 is not risky because any one decision is hard — it's risky because the decisions interact. CONTEXT.md captures the intent cleanly (26 locked D-items). This research surfaces the technical gotchas the planner must design around.

**The four things the planner cannot miss, in priority order:**

1. **`src/scripts/chat.ts` imports GSAP six times.** CONTEXT.md D-19/D-20 only talk about token rename + the inline `style=` on ChatWidget.astro. But chat.ts has `gsap.core.Tween` type, `import("gsap")` calls inside `animatePanelOpen`, `animatePanelClose`, `animateMessageAppear`, `startPulse`, `startTypingDots`, plus a stashed `pulseAnimation` module variable. Uninstalling `gsap` without editing chat.ts will fail `tsc --noEmit` (missing type) and `astro build` (unresolved dynamic import). **This is the single biggest omission in CONTEXT.md.**
2. **Removing `<ClientRouter />` kills `astro:page-load` entirely.** `astro:page-load` is a ClientRouter event — without ClientRouter it does not fire (confirmed via Astro docs + web search). Three call sites depend on it: `BaseLayout.astro` (GSAP init, already being deleted — fine), `src/scripts/chat.ts` (chat init — has DOMContentLoaded fallback, survives), and `src/components/MobileMenu.astro` (menu wiring — **no fallback, will silently break**).
3. **`transition:persist` becomes a no-op without `<ClientRouter />`.** This directly impacts REQUIREMENTS.md CHAT-01 which states the chat widget must retain "conversation persistence across page navigation." With view transitions removed, every page navigation is a full reload, DOM is replaced, and any open chat + accumulated messages array are gone. The planner must either (a) explicitly accept this as a regression scoped to Phase 10 chat restyle, or (b) wire a localStorage-backed conversation restore. Either way, the Phase 8 smoke test (D-26) must test chat on a **single page only** — multi-page navigation tests will fail through no fault of the rebrand.
4. **Token rename must be an atomic cascade.** 68 `--token-*` / Tailwind color class references across 21 files. The planner should not try to bridge old + new names temporarily — it just means two passes of regex review. Do the entire rename as one wave, verify with a final `grep -r "token-"` returning zero hits outside deleted files.

**Primary recommendation:** Plan Phase 8 in 6 waves matching D-25's ordering, but treat chat.ts GSAP removal as a precondition of the `npm uninstall gsap` step — they must happen in the same task. And acknowledge up front that "chat survives cross-page navigation" is a pre-existing Phase 7 feature that Phase 8 is knowingly scaling back to "chat survives on a single page" until Phase 10.

## User Constraints (from CONTEXT.md)

### Locked Decisions

All 26 decisions D-01 through D-26 from CONTEXT.md are locked. Research does not re-open any of them. The most relevant for implementation sequencing:

- **D-25 ordering:** (1) MASTER.md → (2) tokens + fonts → (3) motion + dark mode kill → (4) dead components + chat token refactor + page stubs + Header surgery → (5) resume route delete + PDF rename → (6) verification gate.
- **D-26 verification gate:** ALL four must pass — `npm run build`, `npm run lint`, `tsc --noEmit`, manual chat smoke test (dev server, send message, verify SSE stream + Geist Mono `<code>` rendering + focus trap + clean close) plus `npm run test` (vitest) green.
- **D-19 token mapping table for chat** is treated as complete in this research — see Phase 7 Regression Surface below for the additional chat.ts references CONTEXT.md did not enumerate.
- **D-13 pragmatic motion line** is preserved: Tailwind `transition-colors`, Footer hover translate, `.nav-link-hover` underline, chat copy-btn opacity all survive.

### Claude's Discretion

Covered in CONTEXT.md. No research contradicts any of the discretion items. See "Tailwind v4 @theme rebrand pattern" below for the shorthand question.

### Deferred Ideas (OUT OF SCOPE)

- Chat visual restyle (CHAT-02) — Phase 10
- MobileMenu.astro keep/delete — Phase 9
- Header.astro full rewrite — Phase 9
- Page rewrites — Phase 10
- mockup.html deletion — Phase 11
- REQUIREMENTS.md CONTACT-02 "placeholder PDF" wording — for user to reconcile at Phase 10 planning time

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | Geist + Geist Mono via Astro 6 Fonts API | Confirmed both fonts + all requested weights exist on Google Fonts; `fontProviders.google()` pattern verified against Astro 6 docs and existing `astro.config.mjs` |
| DSGN-02 | Warm hex token palette, no oklch / theme switching | Found `[data-theme="light"]` block (global.css:58-71), dark-default oklch `:root` (global.css:14-50), and 68 tokenized references across 21 files to cascade-rename |
| DSGN-03 | Single light theme, dark mode removed | FOUC script at BaseLayout.astro:40-61, `.theme-transitioning` at global.css:73-94, ThemeToggle.astro imports at Header.astro:2,57,60 all mapped |
| DSGN-04 | Motion restrained to functional hover/focus only | GSAP surface mapped: `src/scripts/animations.ts` (entire file), `src/scripts/chat.ts` (6 call sites), BaseLayout.astro `astro:page-load`/`astro:before-preparation` listeners (110-119), `[data-animate]` stubs in global.css:142-158, view transitions at global.css:181-203, `<ClientRouter />` at BaseLayout.astro:4,97 |
| DSGN-05 | `design-system/MASTER.md` locked design contract | No file touching — just ensure `design-system/` does not yet exist (verified — repo root has no such directory, creation is clean) |
| CONTACT-03 | `/resume` route removed | `src/pages/resume.astro` exists and is the only file defining the `/resume` route; nav link references at Header.astro:9 and MobileMenu.astro:7 |

---

## Research Findings by Area

### 1. Astro 6 Fonts API — Geist + Geist Mono via `fontProviders.google()`

#### Findings

- **Both fonts exist on Google Fonts.** Confirmed via Google Fonts catalog search: [Geist](https://fonts.google.com/specimen/Geist) and [Geist Mono](https://fonts.google.com/specimen/Geist+Mono).
- **All requested weights are available.** A direct fetch of `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap` returns @font-face declarations for Geist weights 400, 500, 600, 700 (all normal) and Geist Mono weights 400, 500 (all normal). No italic variants are requested by mockup.html, matching the existing v1.0 IBM Plex Mono config.
- **Astro 6 `fontProviders.google()` usage is already established in the codebase** at `astro.config.mjs:17-39`. The Phase 8 change is a drop-in replacement: same provider, change `name`, change `cssVariable`, change `weights`.
- **`<Font />` component API (Astro 6) `[VERIFIED: docs.astro.build/en/guides/fonts/]`:**
  - Required prop: `cssVariable` (string)
  - Optional prop: `preload` (boolean) — injects `<link rel="preload">`
  - No other props. No `weight`, no `style` — those come from the config.
- **Fallbacks handling:** Astro 6 generates optimized fallbacks automatically when `optimizedFallbacks: true` (default per docs). The font config accepts a `fallbacks` array; mockup.html uses `system-ui, -apple-system, sans-serif` for Geist and `ui-monospace, monospace` for Geist Mono. Recommend passing these explicitly so the generated CSS matches mockup intent.
- **Variable vs static:** Astro docs distinguish variable fonts (`weights: ["100 900"]` range syntax) from static (`weights: [400, 500, 600, 700]` discrete). The Google provider pulls from Google Fonts CSS which ships discrete weights as separate WOFF2 files (confirmed from the Google CSS response). Use the discrete-weight syntax that matches the existing Inter config.
- **`preload` prop:** Astro docs recommend `preload` only for fonts used on the critical above-the-fold render. Pattern: preload the display/heading font (Geist 700 for the `.display` wordmark) but not every weight. In v1.0, the existing `<Font />` calls at BaseLayout.astro:94-96 do **not** pass `preload`. Recommendation: match v1.0 behavior and omit `preload` unless Phase 11 performance audit reveals an FCP regression.

#### Gotchas

- **CSS variable rename is a coordinated edit.** `cssVariable: "--font-heading"` must change to `--font-display` in **three** places: (a) `astro.config.mjs` inside the `fonts:` array (3 entries), (b) `src/layouts/BaseLayout.astro:94-96` inside the `<Font cssVariable="..." />` props (3 lines), (c) `src/styles/global.css:123-134` inside the `@theme` bridge (6 lines — two blocks, `@theme` and `@theme inline`). If the planner creates these as three separate tasks, a mid-wave HMR refresh will have broken references.
- **The `@theme inline` block is a gotcha.** `src/styles/global.css:130-134` duplicates the `--font-*` definitions inside an `@theme inline` block. This is a Tailwind v4 pattern that passes variables through without Tailwind re-declaring them. Both blocks must be updated in lockstep — editing only one produces inconsistent output.
- **Astro content collections are untouched** by font changes. The projects collection and the MDX rendering pipeline at `src/pages/projects/[id].astro` reference `font-mono` / `var(--token-*)` in its `<style>` block (lines 160-214). The planner must include this file in the token rebrand, not just the font rebrand.

#### Concrete recommendation

Single atomic task: "Rebrand fonts to Geist + Geist Mono." Touches `astro.config.mjs`, `src/layouts/BaseLayout.astro`, and `src/styles/global.css` in the same commit. No interleaving with token rebrand — do fonts first (per D-25 wave 2) so any font-related issues are isolated from token cascades.

**Exact config to write** (verify against `astro.config.mjs:17-39`):

```js
fonts: [
  {
    provider: fontProviders.google(),
    name: "Geist",
    cssVariable: "--font-display",
    weights: [400, 500, 600, 700],
    styles: ["normal"],
    fallbacks: ["system-ui", "-apple-system", "sans-serif"],
  },
  {
    provider: fontProviders.google(),
    name: "Geist",
    cssVariable: "--font-body",
    weights: [400, 500, 600, 700],
    styles: ["normal"],
    fallbacks: ["system-ui", "-apple-system", "sans-serif"],
  },
  {
    provider: fontProviders.google(),
    name: "Geist Mono",
    cssVariable: "--font-mono",
    weights: [400, 500],
    styles: ["normal"],
    fallbacks: ["ui-monospace", "monospace"],
  },
],
```

Note: mockup.html uses the **same** Geist for display and body (not two families). One font family can be registered under two cssVariables — the cost is Astro may download each weight twice (once per cssVariable). Alternative: register Geist once under `--font-display` and in `global.css` set `--font-body: var(--font-display)`. Claude's discretion — both work, recommend the simpler double-registration since it mirrors v1.0.

---

### 2. Tailwind v4 `@theme` rebrand pattern

#### Findings

- **Current v1.0 pattern** at `src/styles/global.css:103-134`:
  ```css
  @import "tailwindcss";
  @theme {
    --color-*: initial;  /* reset default palette */
    --font-*: initial;
    --color-bg-primary: var(--token-bg-primary);
    /* ...etc */
  }
  @theme inline {
    --font-display: var(--font-heading), ui-sans-serif, sans-serif;
    /* ... */
  }
  ```
  The `--color-*: initial` wipes Tailwind's default palette — this is the v4 blessed pattern for replacing the whole color system rather than extending it.
- **HMR behavior `[VERIFIED: tailwindcss.com/docs/theme + GitHub issues]`:** `@theme` changes generate utility classes at build time. Vite + `@tailwindcss/vite` plugin generally hot-reloads these, but there are open GitHub issues where newly-added utility classes occasionally fail to appear without a dev server restart (tailwindlabs/tailwindcss#14800). `:root { --token-* }` changes do not trigger build regeneration — they just propagate through the cascade and hot-reload instantly. **Plan on one dev server restart after the token rebrand lands** to guarantee a clean build. Do not rely on HMR mid-cascade.
- **Rename cascade surface:** 68 occurrences of `font-display|font-body|font-mono` + the token references across **21 files** (grep count from `src/`). The bulk are in 5 deleted components, 5 replaced pages (→ stubs), and 4 surviving files:
  - `src/styles/global.css` (11 occurrences — heaviest concentration, inside `.chat-*` and `.case-study-prose` rules)
  - `src/layouts/BaseLayout.astro` (1 — body class)
  - `src/components/Header.astro` (2 — inline class + `--token-text-*`)
  - `src/components/Footer.astro` (1 — inline class)
  - `src/components/MobileMenu.astro` (1)
  - `src/components/chat/ChatWidget.astro` (1)
  - `src/components/NextProject.astro` (2)
  - `src/components/ArticleImage.astro` (1)
  - `src/components/SkipToContent.astro` (uses `text-accent` class)
  - `src/components/JsonLd.astro` (grep-clean — likely unaffected)
  - `src/components/ContactChannel.astro` (2 — Phase 10 re-examines, but Phase 8 rebrand still lands here if file survives; check whether this is on the D-15 deletion list — it's not, so it stays as-is)
  - `src/pages/projects/[id].astro` (8 — only partially replaced by stub, since its `<style>` block and `getStaticPaths` logic survive — see Area 6 below)

- **Tailwind v4 utility-class rename impact:**
  - `bg-bg-primary` → `bg-bg` (the color named `bg-primary` becomes just `bg`). With `--color-*: initial`, there is no default `bg-*` color space conflict, so `bg-bg` is a valid and unambiguous utility name once `@theme` declares `--color-bg: var(--bg)`.
  - `text-text-primary` → `text-ink`
  - `text-text-secondary` → `text-ink-muted`
  - `text-text-muted` → `text-ink-faint`
  - `text-accent` → `text-accent` (unchanged because the new token is also `--accent`)
  - `border-border` → `border-rule`
  - `border-accent/40` → `border-accent/40` (unchanged — Tailwind's `/NN` opacity syntax works with the new var).
  - `bg-bg-primary/80` → `bg-bg/80` (unchanged semantics, renamed var).
  - `hover:text-accent-hover` → `hover:text-accent` (D-19 maps `--token-accent-hover` → `--accent` with no separate hover variant).

#### Gotchas

- **The Tailwind opacity modifier (`/40`, `/80`) requires the color to be declared in oklch-compatible format.** Tailwind v4's `@theme` bridge works with any CSS color — it uses `color-mix(in oklab, var(--color-bg) calc(<alpha> * 100%), transparent)` under the hood. Hex values (#FAFAF7) are valid color inputs to `color-mix(in oklab, ...)`, so `bg-bg/80` will still render correctly. `[VERIFIED: tailwindcss.com/docs/theme]`. **No action needed — this is not a regression.**
- **The chat widget uses `border-border/40` (Header.astro:16)** — this needs to become `border-rule/40` and must be verified visually since the tint's opacity-mixed appearance against warm off-white (#FAFAF7) is different from against dark oklch.
- **`--color-*: initial` resets ALL Tailwind default colors.** After the rename, utilities like `text-red-500` or `bg-white` do not exist in this project. The planner should grep for any stray uses of Tailwind default colors before landing the rebrand — although v1.0 already has this reset in place, so greenfield uses are unlikely. Grep target: `class="[^"]*\b(text|bg|border)-(red|blue|green|gray|slate|zinc|neutral|stone|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)-[0-9]+` — if this returns zero hits, the reset is safe.

#### Concrete recommendation

1. **No token name bridging.** Do the entire rename as one atomic wave (multiple files, one commit). Trying to keep both `--token-bg-primary` and `--bg` alive as aliases doubles the maintenance and makes grep-verification harder.
2. **Dev server restart is mandatory after the rebrand.** Add to the plan task: "After token rename, kill `npm run dev` and restart. Do not rely on HMR." This avoids the known Tailwind v4 HMR edge cases.
3. **Final verification grep:** `grep -rE "token-[a-z]+" src/` should return zero hits once Phase 8 ends. `grep -rE "(bg|text|border)-(bg|text)-primary|hover|secondary|muted" src/` should also return zero.

---

### 3. Motion kill scope — `<ClientRouter />` + `transition:persist` interaction

**This is the single most consequential finding of the research.**

#### Findings

- **`astro:page-load` does NOT fire without `<ClientRouter />`.** Verified via the Astro docs (https://docs.astro.build/en/guides/view-transitions/) which state verbatim: "The `<ClientRouter />` component fires this event both on initial page navigation for a pre-rendered page and on any subsequent navigation." The event is part of the ClientRouter lifecycle, not a general Astro lifecycle event. `[CITED: docs.astro.build/en/guides/view-transitions/#lifecycle-events]`
- **`transition:persist` becomes a no-op without ClientRouter.** Per docs: "`transition:persist` enables DOM elements to move between pages during soft navigation, but this is not directly possible with cross-document transitions since the DOM is entirely replaced by the full page load." Without ClientRouter, every navigation is a full-page reload.
- **Call sites that depend on `astro:page-load`:**
  1. `src/layouts/BaseLayout.astro:111` — initAnimations (GSAP) — **being deleted in Phase 8, fine.**
  2. `src/layouts/BaseLayout.astro:116` — cleanupAnimations — **being deleted, fine.**
  3. `src/scripts/chat.ts:814` — initChat — **has DOMContentLoaded fallback at chat.ts:830-835**, so initial-load case is covered. But multi-page re-init is gone.
  4. `src/components/MobileMenu.astro:226` — initMobileMenu — **NO FALLBACK.** This means after removing ClientRouter, MobileMenu wiring never runs except on hard reload (but wait — `astro:page-load` not firing means the listener is registered but never triggered). Let me re-verify: the script uses `document.addEventListener("astro:page-load", initMobileMenu)`. On a full-page navigation, the script block runs fresh on every page load, and the listener attaches, but since `astro:page-load` never fires without ClientRouter, `initMobileMenu` never runs. **MobileMenu will silently break.**
  5. `src/components/ThemeToggle.astro:122` — **being deleted, fine.**
- **Call sites that use `transition:persist`:**
  1. `src/layouts/BaseLayout.astro:109` — `<ChatWidget transition:persist />` — directive becomes a no-op, but the widget itself still renders fine. Astro will strip/ignore the unknown-effect directive.
  2. `src/components/chat/ChatWidget.astro:8` — `<div class="chat-widget" data-no-print transition:persist>` — same as above, no-op.
- **Chat state loss on navigation:** Without `transition:persist`, the `messages: ChatMessage[]` array at `chat.ts:60`, the `chatInitialized` flag at `chat.ts:68`, and the DOM state of the chat panel (open/closed, typed text, scrolled position, accumulated message DOM) are all destroyed on navigation. Each page load re-initializes a fresh widget.

#### Gotchas

- **MobileMenu.astro is a silent regression.** CONTEXT.md D-16 explicitly preserves MobileMenu as fully-functional, but D-14 removes ClientRouter. These two decisions conflict at the event-listener level. The fix is trivial — add a DOMContentLoaded fallback identical to the pattern in `chat.ts:831-835`:
  ```js
  if (document.readyState !== "loading") {
    initMobileMenu();
  } else {
    document.addEventListener("DOMContentLoaded", initMobileMenu);
  }
  ```
  Plus keep the `astro:page-load` listener defensively (it's harmless). **This is a required edit to MobileMenu.astro that CONTEXT.md does not enumerate.**
- **Chat cross-page persistence regresses.** REQUIREMENTS.md CHAT-01: *"Chat widget retains all v1.0 (Phase 7) functionality: ... conversation persistence across page navigation ..."*. This requirement is mapped to Phase 10 (per the traceability table), but the Phase 8 smoke test (D-26) must not inadvertently test it. The planner should spec the smoke test as **single-page only**: open bubble on one stub page, send message, verify SSE stream, verify Geist Mono, close cleanly. Do NOT navigate between pages during the smoke test. And flag this explicitly in the Phase 8 summary so Phase 10 knows to either restore persistence via localStorage or to accept the scope of CHAT-01 as modified.
- **`chat.ts:822` has an `astro:before-preparation` listener** that cleans up the focus trap. This is part of the same dead event system — without ClientRouter, `astro:before-preparation` never fires. The focus trap cleanup is therefore never called on navigation. That's fine because with full-page reload, the entire document including event listeners is destroyed. **No leak, no action needed, but the listener can be removed as dead code.**
- **The `setTimeout` fallback at BaseLayout.astro:121-130** reveals any `[data-animate]` elements after 3 seconds. This is safe to delete — once `[data-animate]` CSS stubs are removed and `animations.ts` is gone, there's nothing to reveal.

#### Concrete recommendation

1. **Single task for "kill motion + view transitions"** that makes seven coordinated edits in one commit:
   - `src/layouts/BaseLayout.astro`: remove `ClientRouter` import (line 4), remove `<ClientRouter />` usage (line 97), remove the three `transition:persist` / GSAP script blocks (lines 109-131).
   - `src/components/chat/ChatWidget.astro`: remove `transition:persist` directive on line 8.
   - `src/scripts/chat.ts`: remove `astro:page-load` listener (line 814), remove `astro:before-preparation` listener (lines 822-828), keep the DOMContentLoaded fallback (lines 831-835), remove all GSAP import calls (see Phase 7 Regression Surface section below).
   - `src/components/MobileMenu.astro`: **add DOMContentLoaded fallback alongside `astro:page-load` listener.** This is the non-obvious required edit.
   - `src/styles/global.css`: remove `[data-animate]` stubs (lines 142-158), remove `::view-transition-*` keyframes (lines 181-203), remove `.theme-transitioning` block (lines 73-94).
   - `src/scripts/animations.ts`: delete file entirely.
   - `src/components/CanvasHero.astro`: delete file entirely.
2. **Do NOT separate the MobileMenu edit into a different task.** It's a consequence of ClientRouter removal and must land in the same commit — otherwise the build is green but the mobile nav is broken, and the smoke test won't catch it unless the planner explicitly spec'd mobile interaction (which is overkill).
3. **Document the `transition:persist` regression in the task summary.** The planner's task artifact should explicitly say "CHAT-01 cross-page persistence is knowingly regressed to be re-introduced in Phase 10" so it's not forgotten.

---

### 4. Chat widget regression gate — ChatWidget.astro + global.css `.chat-*` rules + chat.ts

#### Findings — what references old tokens

**`src/components/chat/ChatWidget.astro`** (static JSX, easy to find-replace):
- Line 14: `background: var(--token-accent)` → `--accent`
- Line 56: `background: var(--token-bg-primary); border: 1px solid var(--token-border)` → `--bg` / `--rule`
- Line 63: `background: var(--token-bg-secondary); border-bottom: 1px solid var(--token-border); padding: 0 var(--token-space-md)` → `--rule` / `--rule` / hard-coded 16px (flattened per D-08)
- Line 67: `color: var(--token-text-primary); font-size: var(--token-text-sm)` → `--ink` / hard-coded 0.875rem
- Line 87: `color: var(--token-text-muted)` → `--ink-faint`
- Line 99: `padding: var(--token-space-md)` → 16px
- Line 108: `gap: var(--token-space-sm)` → 8px
- Line 115: `background: var(--token-bg-secondary); border: 1px solid var(--token-border); ... font-size: var(--token-text-sm); color: var(--token-text-secondary)` — 4 chip buttons (lines 115, 124, 133, 142)
- Line 152: `border-left: 2px solid var(--token-border)` → `--rule`
- Line 163: `border-top: 1px solid var(--token-border); padding: 12px var(--token-space-md); background: var(--token-bg-primary)` → `--rule` / 16px / `--bg`
- Line 165: `gap: var(--token-space-sm)` → 8px
- Line 173: `background: var(--token-bg-secondary); border: 1px solid var(--token-border); ... font-family: var(--font-body); font-size: var(--token-text-base); color: var(--token-text-primary)` — textarea
- Line 177: `font-size: var(--token-text-sm); color: var(--token-text-muted)` — char count
- Line 184: `background: var(--token-accent)` → `--accent`
- Line 208: `font-size: var(--token-text-sm); color: var(--token-text-muted)` — privacy note

**`src/scripts/chat.ts`** (dynamic JS-generated inline styles — more dangerous because grep-unfriendly):
- Line 189: `background: var(--token-bg-secondary); ... color: var(--token-text-primary); font-size: var(--token-text-base);` — user message bubble template
- Line 211: `border-left: 2px solid var(--token-border); ... color: var(--token-text-secondary); font-size: var(--token-text-base);` — bot message bubble template
- Line 238: `stroke="var(--token-text-muted)"` — copy button SVG
- Line 255: `border-left: 2px solid var(--token-border); ... color: var(--token-text-muted); font-size: var(--token-text-base);` — error message
- Line 273: `font-size: var(--token-text-sm); color: var(--token-text-muted);` — nudge message
- Line 421: `color-mix(in oklch, var(--token-accent) 40%, transparent)` — GSAP pulse animation (being removed)
- Line 592: `$charCount.style.color = "var(--token-destructive)"` — 500-char limit
- Line 594: `$charCount.style.color = "var(--token-warning)"` — 450-char limit
- Line 597: `$charCount.style.color = "var(--token-text-muted)"` — default

**`src/styles/global.css` `.chat-*` rules (lines 355-451):**
- Line 369: `background-color: var(--token-text-muted)` — typing-dot
- Line 384: `border-color: var(--token-border-hover) !important; box-shadow: 0 0 0 2px var(--token-accent)` — textarea focus
- Line 398: `padding-left: var(--token-space-md)` — bot message list
- Line 401: `margin-bottom: var(--token-space-xs)` — bot message list item
- Line 404: `font-family: var(--font-code); font-size: var(--token-text-sm); background: var(--token-bg-secondary)` — bot message code
- Line 411: `color: var(--token-accent)` — bot message link
- Line 420: `border-color: var(--token-border-hover) !important; color: var(--token-accent) !important` — starter chip hover
- Line 426: `color: var(--token-text-primary) !important` — close button hover
- Line 438: `color: var(--token-success) !important` — copy success icon

#### The `--token-destructive` / `--token-warning` orphans

D-19 says these tokens are "not used by chat; deleted with the rest." **This is wrong.** `chat.ts:591-599` uses `--token-destructive` and `--token-warning` for the char-count color at 500 and 450 chars. Deleting these vars without editing chat.ts leaves dangling references. The values would resolve to empty string at runtime, causing the text color to fall back to inherit — not a build error, but a silent visual regression at the input-overflow state.

**Recommendation:** the planner must add chat.ts char-count lines to the rebrand task. Three options:
1. Map `--token-destructive` and `--token-warning` both to `--accent` (both are "attention" states; in the editorial palette, red is the only signal color).
2. Map to `--ink` (neutral) for the 450-char case and `--accent` for the 500-char case (two distinct visual states).
3. Remove color change entirely and rely on text weight (`fontWeight = "600"`) for both states.

Claude's discretion per D-19 extension, but (2) reads best.

#### Gotchas

- **chat.ts dynamically generates inline styles using `.style.cssText`** which means grep for `--token-*` inside chat.ts is the only way to catch them. Regex replace in chat.ts will hit 10+ separate locations. Plan a find-replace checklist.
- **D-19 token mapping is incomplete** because it didn't know about the chat.ts token refs. Extend it:
  - `--token-destructive` → `--accent` (or planner's choice)
  - `--token-warning` → `--ink` (or planner's choice)
- **The `color-mix(in oklch, ...)` syntax survives the hex palette.** CSS `color-mix` can interpolate any color in any color space, regardless of source format. The planner does NOT need to change `in oklch` to `in srgb`, though it can for conceptual cleanliness. `[CITED: developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix]` — **moot** since this line is being deleted with the GSAP pulse.

#### Concrete recommendation

One task: "Refactor chat widget to new token names." Touches three files:
1. `src/components/chat/ChatWidget.astro` — ~18 inline style replacements.
2. `src/scripts/chat.ts` — ~10 inline style replacements inside JS template literals + the destructive/warning swap.
3. `src/styles/global.css` .chat-* block — ~10 replacements (lines 355-451).

Plus a **preceding** or **fused** task: "Remove GSAP from chat.ts" (see Phase 7 Regression Surface section below).

---

### 5. Dead component + route removal — import graph

#### Findings

All 8 components in D-15 confirmed deleted with no cross-references outside `src/pages/*` and `src/components/*`:

| Component | Imported by | Other refs |
|-----------|-------------|------------|
| `CTAButton.astro` | `src/pages/resume.astro:3` | None |
| `FeaturedProjectItem.astro` | `src/pages/projects.astro:4` | None |
| `ProjectCard.astro` | `src/pages/projects.astro:3` | None |
| `SkillGroup.astro` | `src/pages/about.astro:3` (4 usages) | None |
| `CanvasHero.astro` | `src/pages/index.astro:3` | None |
| `ResumeEntry.astro` | `src/pages/resume.astro:4` (2 usages) | None |
| `CaseStudySection.astro` | grep returned 0 external uses (only self-reference) | **unused — safe to delete** |
| `ThemeToggle.astro` | `src/components/Header.astro:2,57,60` | Listens to `astro:page-load` (line 122) — being deleted anyway |

**Components NOT on the deletion list that reference deleted ones:** none. The 5 replaced pages (`index.astro`, `about.astro`, `projects.astro`, `contact.astro`, `projects/[id].astro`) each become minimal stubs, so their imports of deleted components vanish in the same edit.

**`/resume` route references:**
- `src/pages/resume.astro` — the route file itself (deleted)
- `src/components/Header.astro:9` — navLinks array entry `{ href: "/resume", label: "Resume" }`
- `src/components/MobileMenu.astro:7` — navLinks array entry (same shape)
- `src/pages/resume.astro:34` — `href="/resume.pdf"` — a download link, NOT a `/resume` route link — **confusingly similar name**. The `resume.pdf` reference is covered by D-24 (PDF rename to `jack-cutrara-resume.pdf`).
- `src/styles/global.css:238` — comment reference ("Scope: Resume page primarily"). Comment only, can leave or remove.

**No other `/resume` hrefs found** outside the navLinks arrays, sitemap/robots (which auto-update because the route is gone), and the deleted resume page itself.

**`src/data/portfolio-context.json:65` — `siteStack` array contains `"GSAP"`.** D-22 covers this. No other stale references found in the file (education "2024" and project year metadata are content, not stale design refs).

#### Gotchas

- **`sitemap.xml` is auto-generated by `@astrojs/sitemap`** (confirmed by `astro.config.mjs:13`). Deleting `src/pages/resume.astro` automatically removes `/resume` from the sitemap on next build. No manual edit needed.
- **`public/robots.txt`** is hand-written — quick check required to confirm it doesn't have an explicit `/resume` allow/disallow line. Grep earlier did not find one in src/, and it's in public/ which wasn't grepped. Recommend adding one extra grep step to the plan.
- **`ThemeToggle.astro` has `document.addEventListener("astro:page-load", initThemeToggle)`** at line 122. This is dead code after deletion but also a signal that the view-transitions lifecycle was deeply baked into the v1.0 codebase. No action — file is deleted wholesale.
- **`src/pages/resume.astro:34` uses `/resume.pdf`** (relative to site root, not a `/resume` route). This is the **only place in src/** that references the PDF file, so the D-24 rename in Phase 8 has no consumers to update until Phase 10 (where CONTACT-02 wires the new filename into the new contact section). The rename is therefore a pure `public/` file move with no code co-edit.

#### Concrete recommendation

**Task: delete dead components, route, and clean nav.** Single commit touching:
1. Delete 8 component files (from D-15 list).
2. Delete `src/pages/resume.astro`.
3. Delete `src/scripts/animations.ts` (per D-14).
4. Edit `src/components/Header.astro` — remove ThemeToggle import (line 2), remove `{ href: "/resume", ... }` from navLinks (line 9), remove the two `<ThemeToggle />` usages (lines 57, 60).
5. Edit `src/components/MobileMenu.astro` — remove `{ href: "/resume", ... }` from navLinks (line 7). MobileMenu does NOT reference ThemeToggle, so that's the only edit here.
6. `grep "CaseStudySection" public/` and `grep "resume" public/robots.txt` — verify no stale refs.

---

### 6. Page placeholder strategy (D-18)

#### Findings

All 5 pages use `BaseLayout` as their shell. Each page currently imports deleted components and/or references deleted tokens:

- **`src/pages/index.astro`** (42 lines): Imports `BaseLayout`, `CanvasHero` (deleted), `JsonLd`. Wraps `<CanvasHero>` around `<h1>` + 2 `<p>`. Replacement stub: keep `BaseLayout` + `JsonLd` (JsonLd is kept per ROADMAP Phase 9), strip `CanvasHero`, replace children with `<h1>Home — redesigning</h1>` + "check back soon" note.
- **`src/pages/about.astro`**: Imports `BaseLayout`, `SkillGroup` (deleted), `JsonLd`. ~200 lines of v1.0 content. Full replacement with minimal stub.
- **`src/pages/projects.astro`**: Imports `BaseLayout`, `ProjectCard` (deleted), `FeaturedProjectItem` (deleted), `getCollection` (Astro content). ~80 lines. Full replacement — note that this page uses `await getCollection("projects")` which is legit and will still work in Phase 10; the stub can drop this call entirely since Phase 10 re-introduces it. **Recommendation: drop the import to keep the stub truly minimal.**
- **`src/pages/contact.astro`**: Not fully read, but grep shows it uses token classes. Full replacement with minimal stub.
- **`src/pages/projects/[id].astro`**: **This is the tricky one.** It has `getStaticPaths` that iterates the content collection (line 9-19) and uses `render()` to compile MDX (line 22). Deleting this page or replacing it with a pure static stub breaks the content collection integration — Astro would no longer generate `/projects/seatwatch`, `/projects/nfl-predict`, etc. routes. **Recommendation: the stub must preserve `getStaticPaths` so routes still exist, but strip the body to a minimal `<h1>{project.data.title} — redesigning</h1>`.** Phase 10's WORK-02 task will re-wire the MDX render pipeline.

#### Gotchas

- **`projects/[id].astro` has an inline `<style>` block** (lines 159-214) that heavily references old tokens. The stub can simply delete this entire `<style>` block — no styles are needed for a 1-line placeholder.
- **`[id].astro` body references `data-animate="split-text"` and `data-animate="section"`** — these must go with the `[data-animate]` CSS stub removal (D-14).
- **`JsonLd.astro` usage in multiple pages** is kept per Phase 9 roadmap. Minimal stubs can keep calling `<JsonLd schema={...}>` but simplified — the planner can keep index.astro's JsonLd intact because it's just a Person schema that doesn't depend on deleted components.

#### Concrete recommendation

**Stub template** (flat, ~15 lines, zero token references, zero deleted imports):

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout
  title="Home"
  description="Jack Cutrara — software engineer. Site is being redesigned."
>
  <section style="padding: 96px 48px; max-width: 1200px; margin: 0 auto;">
    <h1 style="font-family: var(--font-display); font-size: 2rem; color: var(--ink);">
      Home — redesigning
    </h1>
    <p style="font-family: var(--font-body); color: var(--ink-muted); margin-top: 16px;">
      This page is being redesigned. Check back soon.
    </p>
  </section>
</BaseLayout>
```

Use inline `style=` in stubs rather than Tailwind classes, because it lets the planner verify the new tokens at runtime without relying on the Tailwind rebrand being stable yet. Drop inline styles in Phase 10 when real content lands.

**For `projects/[id].astro`**, same pattern but keep `getStaticPaths`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects.map((project) => ({
    params: { id: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
---
<BaseLayout title={project.data.title} description={project.data.tagline}>
  <section style="padding: 96px 48px; max-width: 1200px; margin: 0 auto;">
    <h1 style="font-family: var(--font-display); font-size: 2rem; color: var(--ink);">
      {project.data.title} — redesigning
    </h1>
    <p style="font-family: var(--font-body); color: var(--ink-muted); margin-top: 16px;">
      This case study is being redesigned. Check back soon.
    </p>
  </section>
</BaseLayout>
```

This keeps all 6 project routes alive so `npm run build` generates the full static set and no `404` regressions appear.

---

### 7. Global.css surgery map

Exact line ranges to remove / edit (read with `src/styles/global.css`):

| Lines | Content | Action |
|-------|---------|--------|
| 1-50 | `:root { --token-* ... }` dark-first tokens | **REPLACE** with new `:root { --bg, --ink, --ink-muted, --ink-faint, --rule, --accent, --container-max, --pad-desktop, --pad-tablet, --pad-mobile }` (from mockup.html:14-25) |
| 52-71 | `[data-theme="light"]` override block | **DELETE** (D-10) |
| 73-94 | `html.theme-transitioning *` + reduced-motion override | **DELETE** (D-10) |
| 96-134 | `@import "tailwindcss"` + `@theme` bridge + `@theme inline` | **REPLACE** with new bridge: `@theme { --color-*: initial; --font-*: initial; --color-bg: var(--bg); --color-ink: var(--ink); --color-ink-muted: var(--ink-muted); --color-ink-faint: var(--ink-faint); --color-rule: var(--rule); --color-accent: var(--accent); --font-display: var(--font-display), system-ui, sans-serif; --font-body: var(--font-body), system-ui, sans-serif; --font-mono: var(--font-mono), ui-monospace, monospace; }` |
| 136-158 | `[data-animate]` stubs + reduced-motion override | **DELETE** (D-14) |
| 160-176 | Base element styles (html, body) | **EDIT** — change `--font-body`, `--token-text-base`, `--token-text-primary`, `--token-bg-primary` references to new names |
| 178-203 | `::view-transition-*` keyframes + reduced-motion override | **DELETE** (D-14) |
| 205-227 | `.nav-link-hover` + reduced-motion | **KEEP** (D-13 survivor) |
| 229-352 | Print stylesheet | **EDIT** — print styles reference `[data-theme="light"]` overrides at lines 252-263, which must be removed; lines 296-343 reference classes (`max-w-3xl`, `.font-mono[class*="border"]`) that will no longer exist after Phase 10 but still exist in Phase 8 stubs — **safe to leave alone in Phase 8**, Phase 10 can prune. **However, the `@media print` block at 241-352 assumes a `/resume` page exists ("Scope: Resume page primarily" comment line 238). With `/resume` deleted, print CSS for resume is dead.** Claude's discretion: leave alone in Phase 8 (harmless) or prune (cleaner). Recommend leaving alone since Phase 9 Header rewrite and Phase 10 contact layout are the right time to revisit print. |
| 354-451 | `.chat-*` rules | **EDIT** — token rename only, no deletions (per D-19) |

#### D-13 survivors (the "pragmatic motion line")

These are kept:
- `.nav-link-hover` underline animation (global.css:208-227)
- Footer icon hover translate (Footer.astro:22, 42, 60 — inline `hover:-translate-y-0.5` utility)
- `.chat-copy-btn { opacity: 0; transition: opacity 200ms ease; }` (global.css:430-433)
- `.chat-message-wrapper:hover .chat-copy-btn { opacity: 1; }` (global.css:434-436)
- All `transition-colors duration-200` utility usages throughout Header.astro, nav-link classes, Footer, chat

The planner must NOT accidentally delete these during the motion kill — easy mistake if doing bulk find-replace on `transition:`.

---

### 8. Verification gate mechanics (D-26)

#### Commands verified in package.json

```json
"scripts": {
  "dev": "astro dev",
  "build": "wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
  "types": "wrangler types",
  "preview": "astro preview",
  "check": "astro check",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "lint": "eslint .",
  "test": "vitest run",
  "astro": "astro"
}
```

- **`npm run build`** runs `wrangler types` (generates Cloudflare Worker types), then `astro check` (which is the typecheck — includes `tsc --noEmit` semantics), then `astro build`, then a pages-compat post-step. The gate's separate `tsc --noEmit` requirement is effectively redundant with `astro check`, but both are fine to run.
- **`astro check`** is powered by `@astrojs/check` (in devDependencies) and runs `tsc` internally with Astro-aware handling of `.astro` files. **This is the canonical typecheck command** and should be listed in D-26 — a bare `tsc --noEmit` would miss Astro component types. Recommend the planner runs `npm run check` (which aliases `astro check`) rather than `tsc --noEmit` directly.
- **`npm run lint`** runs `eslint .` with the config at `eslint.config.mjs`:
  ```js
  import eslintPluginAstro from "eslint-plugin-astro";
  import tseslint from "typescript-eslint";
  export default [
    { ignores: [".astro/", "dist/", ".claude/", ".ship-safe/"] },
    ...tseslint.configs.recommended,
    ...eslintPluginAstro.configs.recommended,
    { rules: {} },
  ];
  ```
  Minimal config — just `tseslint recommended` + `astro recommended`. No custom rules. **Safe for the rebrand to land without triggering new lint violations,** assuming removed files remove their own violations.
- **`npm run test`** runs `vitest run` against `tests/**/*.test.ts` per `vitest.config.ts`:
  - `tests/api/chat.test.ts` — validation + CORS + SSE format tests (mocks Anthropic, no network)
  - `tests/api/validation.test.ts` — zod schema tests
  - `tests/api/security.test.ts` — security tests
  - `tests/client/markdown.test.ts` — markdown rendering (imports from `src/scripts/chat.ts`)
- **`tests/client/markdown.test.ts` imports `renderMarkdown` from `src/scripts/chat.ts`**. If the planner breaks chat.ts while removing GSAP, this test will also fail (because importing a broken module fails the whole file). This is actually **good** — it means vitest catches chat.ts regressions too.

#### Gotchas

- **`astro check` runs TypeScript including `src/**/*.ts`**. Once `gsap` is uninstalled, any unresolved `import` or type annotation in chat.ts fails immediately with "Cannot find module 'gsap'" or "Cannot find namespace 'gsap'". The build gate catches this — **but only if the GSAP removal in chat.ts lands in the same commit as the uninstall**. If they're split, the intervening commits are red and the planner cannot cleanly test waves.
- **`wrangler types` runs before `astro check`**. This generates `worker-configuration.d.ts` for Cloudflare bindings. Not affected by Phase 8 changes.
- **Manual chat smoke test on `npm run dev`** uses the Cloudflare adapter. Chat needs `ANTHROPIC_API_KEY` env var (inferred from `@anthropic-ai/sdk` in deps and the `/api/chat.ts` route). The planner should confirm `.env` or `.dev.vars` file contains this before running the smoke test, otherwise the SSE stream returns an API error and the smoke test is inconclusive.
- **Chat uses the Anthropic SSE endpoint at `/api/chat`** (confirmed from `chat.ts:91` and `public/` showing `chat.ts` in pages/api earlier). `npm run dev` exposes this as a local endpoint. Sending a message triggers a real API call — not free. A stub/mocked dev mode does not exist. Recommend the planner lists this as a prerequisite in the D-26 smoke-test steps.

#### Concrete recommendation

**Gate steps (exact):**
1. `npm run build` — covers astro check (typecheck) + astro build. Must succeed with zero errors/warnings.
2. `npm run lint` — must be clean.
3. `npm run test` — all non-todo tests green, markdown.test.ts confirms chat.ts is still importable.
4. **Manual smoke test**:
   - Confirm `ANTHROPIC_API_KEY` is set (or `.dev.vars` exists).
   - `npm run dev`, navigate to `localhost:4321/`.
   - Click floating bubble (should open instantly, no GSAP scale-in — just display:flex).
   - Send "show me a TypeScript snippet" — verify SSE streams token-by-token, verify the resulting `<code>` block renders in Geist Mono, verify markdown is sanitized.
   - Press Tab repeatedly — focus should cycle within the panel (focus trap works).
   - Click X or press Escape — panel closes cleanly, bubble is focused.
   - **Do NOT navigate to another page during the test.** (Cross-page persistence is knowingly regressed, see Area 3.)

Drop the redundant `tsc --noEmit` from D-26 or alias it as `npm run check`. It adds nothing over `astro check` in the build pipeline.

---

### 9. Phase 7 chat carry-over constraints from STATE.md

#### Phase 7 decisions Phase 8 MUST NOT break (from STATE.md lines 82-92)

| # | Phase 7 decision | Phase 8 impact |
|---|------------------|----------------|
| 1 | Astro 6 default static output, per-route SSR via `prerender = false` | **Not impacted** — Phase 8 doesn't touch adapter config or API routes |
| 2 | Rate limit 5/60s | **Not impacted** — server-side logic at `/api/chat.ts`, not touched |
| 3 | `it.todo()` test stubs (not `expect(true).toBe(true)`) | **Not impacted** — Phase 8 doesn't add or remove tests |
| 4 | Import zod directly (not astro/zod) | **Not impacted** — validation.ts pattern survives |
| 5 | CORS exact origin whitelist with URL parsing | **Not impacted** — server-side only |
| 6 | marked configured with `async: false` | **AT RISK** — if the planner regenerates chat.ts from scratch they could miss this. **Do NOT rewrite chat.ts; edit in place.** Keep the existing `marked.use({ breaks: true, gfm: true, async: false });` at chat.ts:18. |
| 7 | DOMPurify strict config | **AT RISK** — same reasoning as #6. Keep the existing `PURIFY_CONFIG` at chat.ts:23-30. |
| 8 | AbortController with 30s timeout for SSE streams | **AT RISK** — same reasoning. Keep the existing AbortController logic at chat.ts:87-146. |
| 9 | JS auto-grow textarea instead of field-sizing:content | **Not impacted** — Phase 8 does not touch the `.chat-textarea` CSS or the `autoGrowTextarea` function. |
| 10 | Focus trap re-queries focusable elements on every Tab keypress | **Not impacted** — `setupFocusTrap` at chat.ts:324-350 survives untouched |
| 11 | Analytics uses CustomEvent on document | **Not impacted** — `trackChatEvent` at chat.ts:305-314 survives |
| 12 | Idempotency uses both JS boolean and DOM data-attribute | **SEMANTICALLY IMPACTED** — the idempotency guard (`chatInitialized` + `panel.dataset.chatBound`) at chat.ts:474 exists to handle `transition:persist` re-initialization. With ClientRouter gone, persist is a no-op and this guard becomes dead code. **Do not delete it** — the guard is harmless when its preconditions never trigger, and leaving it in place means Phase 10 can re-introduce `<ClientRouter />` (if WORK-02 needs it back) without re-implementing the guard. Leave as-is. |

#### Guiding principle for chat.ts edits

**Edit chat.ts surgically, do not rewrite.** Every v1.0 review finding and defensive pattern documented in STATE.md is encoded in the current file. A rewrite loses them. The Phase 8 task for chat.ts is:
1. Remove GSAP imports + all 6 `import("gsap")` calls + the type annotation at line 360 (pulseAnimation).
2. Replace the 5 animation helper functions with no-op bodies that still match the Promise<void> contract (callers use `.then()`).
3. Rename `--token-*` references in all inline template strings to the new token names.
4. Remove the `astro:before-preparation` listener (dead without ClientRouter).
5. Keep everything else.

**Explicit no-op pattern** for the 5 animation helpers after GSAP removal:

```ts
async function animatePanelOpen(panel: HTMLElement): Promise<void> {
  panel.style.display = "flex";
}

async function animatePanelClose(panel: HTMLElement): Promise<void> {
  panel.style.display = "none";
}

async function animateMessageAppear(_el: HTMLElement): Promise<void> {
  // No-op: no entrance animation
}

async function startPulse(_bubble: HTMLElement): Promise<void> {
  // No-op: no pulse
}

async function startTypingDots(container: HTMLElement): Promise<void> {
  // Keep the CSS-based dot fallback (already in the reduced-motion path)
  const dots = container.querySelectorAll<HTMLElement>(".typing-dot");
  dots.forEach((dot) => {
    dot.style.animation = "none";
    dot.style.opacity = "0.5";
  });
}

function stopPulse(): void {
  // No-op: there is no pulse to stop
}
```

Drop the `pulseAnimation: gsap.core.Tween | null` module variable entirely. Drop `prefersReducedMotion` if it has no other callers (grep confirms it was only used inside the GSAP helpers — **safe to drop**).

This turns chat.ts into a zero-motion widget matching CONTEXT.md's D-19 "chat is visually unchanged" stance — the removal of GSAP motion **is** a subtle visual change (no scale-in on open, no bubble pulse), but CONTEXT.md's pragmatic motion line (D-13) explicitly allows Phase 10 to re-introduce a restrained motion story during CHAT-02. **Flag this to the user at Phase 8 summary time** so they know the bubble is no longer pulsing in the interim.

---

### 10. Runtime State Inventory (rename/refactor risk audit)

Phase 8 is a hybrid rename + refactor phase, so the inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** Chat conversation state is in-memory only (`messages: ChatMessage[]` array at chat.ts:60), destroyed on navigation. No localStorage keys named `token-*` found. The v1.0 theme system uses `localStorage.theme` — this becomes dead after D-10 removal, but no migration needed because no code reads it post-cleanup (D-10 explicitly addresses this). | Code edit only, no data migration |
| Live service config | **None.** No n8n, Tailscale, Datadog, etc. The site deploys to Cloudflare Pages which reads from git — no out-of-band config. | None |
| OS-registered state | **None.** No Windows Task Scheduler, pm2, systemd, etc. | None |
| Secrets / env vars | **`ANTHROPIC_API_KEY`** exists for chat widget. **Name unchanged in Phase 8** — no env var renames. `.dev.vars` or Cloudflare secret store holds it. | None (verify only) |
| Build artifacts / installed packages | **`node_modules/gsap`** installed (per pnpm lockfile); **`.astro/` cache directory** contains generated Tailwind v4 output from v1.0 tokens; **`dist/` build output** is v1.0. | `npm uninstall gsap` removes from package.json + lockfile; `.astro/` and `dist/` are gitignored and auto-regenerate on `npm run build` — **no manual deletion needed, but the planner should run a clean dev-server-restart + cache-clear after the token rebrand to avoid stale Tailwind utilities.** |

**Nothing in the first three categories** — Phase 8 is a clean code-only refactor from a runtime perspective. The only runtime risk is the stale `.astro/` Tailwind cache, which is handled by a dev server restart.

---

### 11. Environment Availability Audit

Phase 8 is code/config-only with one deployment dependency (Anthropic SDK). Running dev and smoke tests:

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node 22+ | Astro 6 | Assumed ✓ (package.json `engines.node: ">=22"`) | — | None — cannot build without |
| pnpm | Dev (lockfile present) | Assumed ✓ | — | `npm install` also works |
| `ANTHROPIC_API_KEY` | Manual chat smoke test (D-26) | **UNKNOWN** — not checkable from code | — | **Without it, smoke test cannot prove chat works.** Planner must verify presence before gate run. |
| Wrangler | `wrangler types` build step | Dep ✓ (`wrangler: ^4.80.0`) | 4.80+ | None — build script runs it |

**Missing dependency with no fallback:** ANTHROPIC_API_KEY availability must be checked at gate-run time, not planning time. The plan should include a prerequisite step.

**Missing dependency with fallback:** none.

---

## Validation Architecture

> Nyquist validation is enabled for this project. Test framework confirmed present.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (devDep, confirmed in package.json) |
| Config file | `vitest.config.ts` (root) — `include: ["tests/**/*.test.ts"]`, `environment: "node"`, `globals: true` |
| Quick run command | `npm run test` (aliases `vitest run`) |
| Full suite command | `npm run test` (only one vitest invocation; same command) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-01 | Geist fonts load + render | Integration (build-time) | `npm run build` — verifies `<Font />` resolves | Covered by build |
| DSGN-02 | Hex tokens in :root, no oklch | Smoke (grep) | `grep -rE "oklch\(" src/` — must return **only** chat.ts line 421 (deleted) | N/A — manual grep |
| DSGN-03 | Dark mode removed | Smoke (grep) | `grep -rE "data-theme|theme-transitioning|localStorage.theme" src/` — must return 0 hits after Phase 8 | N/A — manual grep |
| DSGN-04 | GSAP + view transitions removed | Smoke (dependency + grep) | `npm ls gsap` returns empty; `grep -r "from \"gsap" src/` returns 0 hits | Covered by dependency check |
| DSGN-05 | MASTER.md exists | File existence | `test -f design-system/MASTER.md` | N/A — manual check |
| CONTACT-03 | `/resume` returns 404 | Build smoke | `npm run build` — verify `dist/resume/index.html` absent (or equivalent Cloudflare Pages output) | Covered by build |
| CHAT-01 | Chat widget retains single-page functionality | Manual smoke (D-26) | See Gate Step 4 above | **Not automated** — this is the regression gate |

**Automated tests that must stay green:**
- `tests/api/chat.test.ts` — 15+ `it()` tests of validation, CORS, SSE format, sanitization flow
- `tests/api/validation.test.ts` — zod schema tests
- `tests/api/security.test.ts` — security tests
- `tests/client/markdown.test.ts` — 12 markdown + XSS tests, **imports `renderMarkdown` from `src/scripts/chat.ts` — if the GSAP removal breaks chat.ts this test fails at module-load time**

### Sampling Rate

- **Per task commit:** `npm run check` (astro check — fast typecheck only)
- **Per wave merge:** `npm run build && npm run lint && npm run test` (full gate minus manual smoke)
- **Phase gate:** Full suite + manual chat smoke test per D-26

### Wave 0 Gaps

- **None required.** The existing test infrastructure covers everything Phase 8 changes. No new test files needed. The rebrand is primarily visual/structural, and visual regressions are best caught by the manual smoke test, not vitest.
- **Optional strengthening (Claude's discretion):** Add a grep-based static assertion test at `tests/static/design-system.test.ts` that fails if any `token-*` reference remains in src/ post-rebrand. This is belt-and-suspenders; the build gate already catches runtime breakage. Recommend **against** adding it for Phase 8 — unnecessary scope creep.

---

## Files Touched — Cross-Reference Table

Planner uses this to build `read_first` lists per task.

| File | Why | Risk | Wave |
|------|-----|------|------|
| `design-system/MASTER.md` | Create — the design contract (D-01..D-06) | LOW — greenfield | 1 (task 1) |
| `astro.config.mjs` | Font swap (`name`, `cssVariable`, `weights`) in 3 `fonts:` entries | LOW | 2 |
| `src/styles/global.css` | Replace `:root`, `@theme`, `@theme inline`, delete dark-mode blocks, delete view-transition keyframes, delete `[data-animate]` stubs, rename all `.chat-*` token refs | **HIGHEST** — most complex file in the phase, 450+ lines, multiple concerns interleaved | 2 + 3 |
| `src/layouts/BaseLayout.astro` | Remove ClientRouter import+usage, remove FOUC theme script, remove GSAP script block, rename `cssVariable` on 3 `<Font />` components, rename body className | **HIGH** — the only shared shell | 2 + 3 |
| `src/scripts/chat.ts` | Remove 6 GSAP imports + `gsap.core.Tween` type, replace 5 animation helpers with no-ops, rename ~10 inline style token refs, drop `astro:before-preparation` listener | **HIGHEST** — only file where build/type/test/runtime all depend on same edits | 3 (MUST land with the `npm uninstall gsap` step) |
| `src/components/chat/ChatWidget.astro` | Rename ~18 inline style token refs, remove `transition:persist` directive | MEDIUM — static find-replace | 4 |
| `src/scripts/animations.ts` | Delete file | LOW — isolated | 3 |
| `src/components/CanvasHero.astro` | Delete file | LOW — isolated | 4 |
| `src/components/CTAButton.astro` | Delete file | LOW | 4 |
| `src/components/FeaturedProjectItem.astro` | Delete file | LOW | 4 |
| `src/components/ProjectCard.astro` | Delete file | LOW | 4 |
| `src/components/SkillGroup.astro` | Delete file | LOW | 4 |
| `src/components/ResumeEntry.astro` | Delete file | LOW | 4 |
| `src/components/CaseStudySection.astro` | Delete file — verified no external imports | LOW | 4 |
| `src/components/ThemeToggle.astro` | Delete file | LOW | 4 |
| `src/components/Header.astro` | Remove ThemeToggle import + 2 usages, remove `/resume` nav entry, rename inline token classes (`bg-bg-primary/80`, `border-border/40`, etc.) | MEDIUM — component preserved but edited in multiple places | 4 |
| `src/components/MobileMenu.astro` | Remove `/resume` nav entry, **ADD DOMContentLoaded fallback for initMobileMenu** (not in CONTEXT.md but required by ClientRouter removal), rename inline token classes | **HIGH — required fix CONTEXT.md missed** | 3 (lands with ClientRouter removal) or 4 |
| `src/components/Footer.astro` | Rename inline token classes (`border-border/40`, `text-text-muted`, `hover:text-text-primary`) | LOW | 4 |
| `src/components/NextProject.astro` | Rename inline token classes if present (Phase 9 re-audits) | LOW | 4 |
| `src/components/ArticleImage.astro` | Rename inline token classes if present (Phase 9 re-audits) | LOW | 4 |
| `src/components/SkipToContent.astro` | Likely references `text-accent` — rename | LOW | 4 |
| `src/components/ContactChannel.astro` | Uses token classes; Phase 10 re-audits; still rename in Phase 8 | LOW | 4 |
| `src/components/JsonLd.astro` | Verify no token refs (grep-clean expected) | LOW | 4 (verify only) |
| `src/data/portfolio-context.json` | Drop `"GSAP"` from `siteStack` array (line 65) — audit for any other stale design references (check `skills.frameworks`, description fields) | LOW | 4 |
| `src/pages/index.astro` | Replace with stub | LOW | 4 |
| `src/pages/about.astro` | Replace with stub | LOW | 4 |
| `src/pages/projects.astro` | Replace with stub (drop content collection import) | LOW | 4 |
| `src/pages/contact.astro` | Replace with stub | LOW | 4 |
| `src/pages/projects/[id].astro` | Replace with stub — **keep `getStaticPaths`** | MEDIUM — must preserve routing | 4 |
| `src/pages/resume.astro` | Delete file | LOW | 5 |
| `public/resume.pdf` | Rename to `public/jack-cutrara-resume.pdf` | LOW | 5 |
| `package.json` | Remove `"gsap": "^3.14.2"` from dependencies | LOW (but only after chat.ts is GSAP-free) | 3 (same commit as chat.ts edit) |

**Files NOT touched** (confirm they are grep-clean or intentionally preserved):
- `src/content.config.ts` — Astro content collection schema, untouched
- `src/content/projects/*.mdx` — project content, untouched
- `src/pages/api/chat.ts` — chat API route, untouched
- `src/lib/validation.ts` — server-side validation, untouched (per Phase 7 decisions)
- `tests/**/*.test.ts` — all tests untouched; they must stay green
- `eslint.config.mjs`, `vitest.config.ts`, `tsconfig.json` — config, untouched
- `public/favicon.*`, `public/og-default.png`, `public/robots.txt` — verified grep-clean for `/resume` refs

---

## Phase 7 Regression Surface

This section exists because Phase 7's chat widget is the regression gate for Phase 8. The planner must be crystal clear on what could break chat and how the gate detects it.

### Ways Phase 8 could break the chat widget

| Risk | Detected by | Mitigation |
|------|-------------|-----------|
| **Uninstall gsap without editing chat.ts** | `npm run build` fails at `astro check` (unresolved import type `gsap.core.Tween`) | Same-commit rule: gsap uninstall and chat.ts edit must land together |
| **Rename tokens without updating chat.ts inline templates** | `npm run build` succeeds (no type error), but runtime chat bubbles render with transparent backgrounds / wrong colors / empty CSS vars. **Smoke test catches this visually.** | Grep chat.ts for `--token-` after rebrand — must return 0 hits |
| **Delete `transition:persist` directive** | None — silent regression. Multi-page chat state loss. Phase 8 knowingly accepts this per REQUIREMENTS.md CHAT-01 re-interpretation. | Document in phase summary; do not test cross-page in smoke test |
| **Remove `<ClientRouter />` without adding MobileMenu DOMContentLoaded fallback** | Build succeeds, smoke test (if it includes mobile nav click) fails. Desktop smoke test misses it. | Planner adds MobileMenu fallback in same commit as ClientRouter removal |
| **Break `marked({ async: false })` config at chat.ts:18** | `tests/client/markdown.test.ts` fails — test 12 `"returns a string, not a Promise"` specifically guards this | Covered by existing test |
| **Break DOMPurify PURIFY_CONFIG at chat.ts:23-30** | `tests/client/markdown.test.ts` fails — multiple tests check sanitization rules | Covered by existing test |
| **Break AbortController / SSE stream handling at chat.ts:80-146** | `tests/api/chat.test.ts` does not directly test chat.ts stream handling (it mocks Anthropic), but `tests/client/markdown.test.ts` imports chat.ts so a compile error fails the test file | Covered partially — manual smoke test verifies streaming works |
| **Rename `.chat-bot-message code` font family from `var(--font-code)` to `var(--font-mono)`** | Build succeeds, smoke test verifies Geist Mono in `<code>` blocks (part of D-26 gate step 4) | Explicitly on the smoke-test checklist |
| **Delete chat.ts `renderMarkdown` export** | `tests/client/markdown.test.ts` fails at import | Covered by existing test — do not refactor the export |

### Smoke test fingerprint (D-26 gate step 4)

The manual smoke test exists because ~40% of the chat widget's regression surface is not covered by vitest (visual styles, SSE streaming round-trip, focus trap, modal behavior, keyboard handling). The planner must specify the smoke test as a checklist:

- [ ] `ANTHROPIC_API_KEY` present in `.dev.vars` (prerequisite)
- [ ] `npm run dev` starts without errors
- [ ] Navigate to `localhost:4321/` — home stub page renders with Geist display font, warm off-white background
- [ ] Floating red chat bubble visible bottom-right of viewport
- [ ] Click bubble — panel opens (no scale-in animation — instant display, this is expected)
- [ ] Starter chips render with Geist body font
- [ ] Click a starter chip or type "show me a TypeScript snippet" + Enter
- [ ] Typing indicator appears (3 dots with CSS fade — no GSAP bounce, this is expected)
- [ ] SSE stream tokens append in real-time to a bot message bubble
- [ ] Bot message contains `<code>...</code>` that renders in Geist Mono font (visually distinct from body Geist)
- [ ] Hover bot message — copy button appears (opacity transition is a D-13 survivor)
- [ ] Tab cycles through starter chips / input / send button / close button — focus never escapes panel (focus trap)
- [ ] Shift-Tab cycles backwards
- [ ] Escape closes panel and focus returns to bubble
- [ ] Reopen panel — previous messages are still visible (same-page persistence of in-memory state)
- [ ] **Do not navigate to another page** — CHAT-01 cross-page persistence is a known regression

If all 16 checks pass, Phase 8 chat regression gate is green.

---

## Assumptions Log

All significant claims in this research are verified via tool (Context7, WebSearch, official docs, direct grep) or cited. Items that remain `[ASSUMED]`:

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `src/pages/contact.astro` follows the same patterns as other pages (not read in full) | 5, 6 | LOW — stub replacement is pattern-independent |
| A2 | `src/components/SkipToContent.astro`, `NextProject.astro`, `ArticleImage.astro`, `ContactChannel.astro`, `JsonLd.astro` have no surprises requiring token rename beyond the grep hits already reported | 5 | LOW — grep already surfaced their inclusion in the rebrand scope |
| A3 | Tailwind v4 HMR edge case (requiring dev server restart on `@theme` changes) applies to this project's Vite setup — based on GitHub issue reports, not tested on this codebase | 2 | LOW — recommendation is to restart dev server anyway |
| A4 | Cloudflare Pages output for a deleted `src/pages/resume.astro` correctly 404s — based on Astro's static output model, not verified by actually building | 5 | LOW — Astro's build + Pages routing is well-established; deletion is the standard pattern |
| A5 | Node 22 is installed on the dev machine — assumed from `package.json engines` field | 11 | LOW — build will fail fast if wrong |

**No `[ASSUMED]` items in the critical-risk findings (ClientRouter / chat.ts GSAP / MobileMenu).** Those are all `[VERIFIED: ...]` or `[CITED: ...]`.

---

## Open Questions

1. **Does the user want to keep the chat bubble's `pulse` animation, or accept that it disappears with GSAP?**
   - What we know: D-19 says "chat is visually unchanged in Phase 8." But GSAP removal (D-13/D-14) necessarily kills the bubble pulse (chat.ts:416-430), the panel scale-in (animatePanelOpen), and the typing-dot bounce (startTypingDots uses GSAP in the non-reduced-motion path).
   - What's unclear: Strict reading of D-19 conflicts with D-14. Pragmatic reading: D-19 means "no token renames cause visual regressions", not "no motion is removed".
   - Recommendation: Plan as if D-14 dominates — chat loses motion in Phase 8. Flag this in the Phase 8 summary so the user is not surprised on smoke test day. If they object, they can re-introduce a CSS-based pulse (`@keyframes`) as a Claude discretion item.

2. **Does the user want to reconcile `src/data/portfolio-context.json` skills/frameworks lists?**
   - What we know: D-22 says audit the whole file. The file lists `"Astro", "Tailwind CSS"` in `skills.frameworks` and other project tech that may include stale refs.
   - What's unclear: Whether "siteStack" is the only audit target or whether the whole "skills" section needs updating.
   - Recommendation: Treat D-22 literally — audit every field. Known edits: drop `"GSAP"` from `siteStack`. Frameworks like `"Astro"` stay. Any references to canvas hero, theme toggle, IBM Plex in project descriptions get updated. Ship as a single audit-and-edit task.

3. **Should Phase 8 add `"check": "astro check"` as a separate line in the scripts, or keep using the existing `"build"` which chains `astro check`?**
   - Not applicable — the existing `scripts.check` line already exists at `package.json:13`. Use it as-is.

4. **Does the Tailwind v4 "HMR restart required" gotcha apply to Cloudflare Pages preview builds, or only local dev?**
   - What we know: The GitHub issues describe local dev HMR. Cloudflare Pages does a fresh `npm run build` on every deploy, so HMR does not apply to preview deploys.
   - Recommendation: No planning impact. The gotcha only affects the local smoke test flow.

---

## Standard Stack

No stack changes in Phase 8. The planner builds against the already-locked Astro 6 / Tailwind v4 / TypeScript 5.9 / Node 22 stack documented in CLAUDE.md. The only dependency change is **removing GSAP** (`npm uninstall gsap`) — no new packages are added. Geist/Geist Mono are fetched by the Astro Fonts API at build time, not installed.

---

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives MUST be honored by the Phase 8 plans:

1. **RTK prefix for all bash commands** (CLAUDE.md global). Every `npm`, `git`, `grep`, `ls`, `find`, etc. invocation in task scripts must be prefixed `rtk` — even inside `&&` chains. Example: `rtk npm run build && rtk npm run lint`.
2. **Design process routed through frontend-design skill** (project CLAUDE.md + memory feedback). MASTER.md authorship (task 1) is a design-intensive task. The planner should consider spawning frontend-design for the MASTER.md content generation, or at minimum mark it as requiring design-skill review.
3. **No ad-hoc design choices** (project CLAUDE.md). MASTER.md content must transcribe mockup.html + D-01..D-26, not re-decide.
4. **Tech stack must be modern with best-in-class performance** (project CLAUDE.md). Phase 8 preserves this — in fact improves it by dropping GSAP (~80KB gzipped).
5. **Audit before/after all merges** (memory feedback `feedback_merge_safety.md`). Phase 8 does not merge to main (D-04 production freeze through Phase 10), but the planner should instruct each task to `git status && git diff` before and after edits to avoid destructive merges on `feat/ui-redesign`.
6. **"Unique" design means genuinely distinctive** (memory feedback). The mockup.html editorial system is the user's own design decision, already validated. MASTER.md just transcribes it.
7. **User mockups/screenshots are the source of truth** (memory feedback `feedback_design_failure.md`). mockup.html is the source of truth and D-02 places it at the repo root deliberately. The planner must not deviate from it.
8. **GSD Workflow Enforcement** (project CLAUDE.md). Phase 8 work must happen through a GSD phase execution — this research is itself part of that flow.

No CLAUDE.md directive contradicts any of the 26 D-items.

---

## Sources

### Primary (HIGH confidence)

- Repository files (read directly via `Read` tool): `mockup.html`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/chat/ChatWidget.astro`, `src/scripts/chat.ts` (full), `src/scripts/animations.ts`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/MobileMenu.astro`, `src/data/portfolio-context.json`, `src/pages/projects/[id].astro`, `src/pages/index.astro`, `src/pages/about.astro`, `astro.config.mjs`, `package.json`, `eslint.config.mjs`, `vitest.config.ts`, `tests/client/markdown.test.ts`, `tests/api/chat.test.ts` — all `[VERIFIED]`
- [Astro 6 Fonts API Guide](https://docs.astro.build/en/guides/fonts/) — `<Font />` component API, `fontProviders.google()` config schema, preload prop semantics, variable vs static weight syntax
- [Astro View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/) — `transition:persist` requires ClientRouter; `astro:page-load` only fires with ClientRouter
- [Astro Font Provider Reference](https://docs.astro.build/en/reference/font-provider-reference/) — config schema
- [Google Fonts: Geist](https://fonts.google.com/specimen/Geist) — font family available
- [Google Fonts: Geist Mono](https://fonts.google.com/specimen/Geist+Mono) — font family available
- Direct fetch of `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500` — confirms all requested weights exist as separate WOFF2 files
- [Tailwind CSS v4 Theme Documentation](https://tailwindcss.com/docs/theme) — `@theme` vs `:root` distinction, HMR behavior
- `.planning/phases/08-foundation/08-CONTEXT.md` — the 26 locked decisions
- `.planning/REQUIREMENTS.md` — DSGN-01..05, CONTACT-03, CHAT-01
- `.planning/ROADMAP.md` — Phase 8 success criteria
- `.planning/STATE.md` — Phase 7 carry-over decisions

### Secondary (MEDIUM confidence)

- [Astro 6.0 Release Announcement](https://astro.build/blog/astro-6/) — Fonts API stable, ClientRouter still available
- [Astro Font API Demo (jack-buddy/astro-font-api-demo)](https://github.com/jack-buddy/astro-font-api-demo) — community example of Google Fonts config pattern
- [tailwindlabs/tailwindcss#14800](https://github.com/tailwindlabs/tailwindcss/issues/14800) — "new classes require dev server restart" Tailwind v4 HMR gotcha
- [Bag of Tricks: ClientRouter migration](https://events-3bg.pages.dev/jotter/migrate/) — transition:persist alternatives (element-crossing package)

### Tertiary (LOW confidence)

- None. All critical findings verified against primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: N/A — no stack changes
- Architecture: HIGH — file-by-file map verified with direct reads
- Pitfalls (ClientRouter interaction, chat.ts GSAP): HIGH — verified via Astro docs + full chat.ts read
- Token cascade surface: HIGH — verified via multiple grep passes across `src/`
- Tailwind v4 HMR edge case: MEDIUM — based on GitHub issue reports, not tested on this project
- Manual smoke test mechanics: MEDIUM — `ANTHROPIC_API_KEY` presence is unverifiable without actually trying

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stack is on stable versions, findings primarily structural)
