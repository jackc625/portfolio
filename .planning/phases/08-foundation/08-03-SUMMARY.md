---
phase: 08-foundation
plan: 03
subsystem: foundation
tags: [dark-mode-kill, gsap-removal, motion-kill, client-router-removal, editorial-redesign, v1.1]
requires: [08-02]
provides:
  - "dark-mode-free BaseLayout (no FOUC script, no data-theme writes)"
  - "GSAP-free codebase (0 imports, 0 gsap. refs, dependency uninstalled)"
  - "motionless chat widget (no pulse, no panel scale-in, no typing-dot bounce)"
  - "DOMContentLoaded fallback for MobileMenu initialization"
  - "global.css purged of [data-animate], view-transition keyframes, theme-transitioning"
affects:
  - src/layouts/BaseLayout.astro
  - src/styles/global.css
  - src/scripts/chat.ts
  - src/components/MobileMenu.astro
  - src/components/chat/ChatWidget.astro
  - src/scripts/animations.ts (deleted)
  - package.json
  - pnpm-lock.yaml
tech_stack:
  added: []
  removed: [gsap]
  patterns:
    - "no-op animation helpers that preserve Promise<void> contract"
    - "dual-path initialization (DOMContentLoaded + defensive astro:page-load)"
key_files:
  created: []
  modified:
    - src/layouts/BaseLayout.astro
    - src/styles/global.css
    - src/scripts/chat.ts
    - src/components/MobileMenu.astro
    - src/components/chat/ChatWidget.astro
    - package.json
    - pnpm-lock.yaml
  deleted:
    - src/scripts/animations.ts
decisions:
  - "[Plan 08-03]: chat motion restoration (bubble pulse, panel scale-in, typing-dot bounce) deferred to Phase 10 CHAT-02 per D-27 — Phase 8 leaves chat functional but motionless"
  - "[Plan 08-03]: cross-page chat persistence (CHAT-01) descoped for Phase 8 per D-29 — transition:persist depends on ClientRouter which is deleted"
  - "[Plan 08-03]: MobileMenu uses dual-path init (DOMContentLoaded fallback + defensive astro:page-load) per D-30 — Phase 10 can re-introduce ClientRouter without re-adding listeners"
  - "[Plan 08-03]: project uses pnpm (pnpm-lock.yaml), not npm — plan spec referenced package-lock.json but actual lockfile is pnpm-lock.yaml; executor ran `pnpm remove gsap` and staged pnpm-lock.yaml instead"
metrics:
  duration_min: 8
  tasks_completed: 3
  files_modified: 7
  files_deleted: 1
  commits: 3
completed: 2026-04-07
requirements_addressed: [DSGN-03, DSGN-04]
---

# Phase 8 Plan 3: Dark Mode + Motion + GSAP Demolition Summary

One-liner: Scorched-earth removal of dark mode, GSAP motion machinery, ClientRouter view transitions, and the chat widget's animation layer across 7 files (1 deleted) in 3 atomic commits, satisfying DSGN-03 (dark-mode kill) and DSGN-04 (motion removal) structurally.

## What Changed

### Task 1 — Dark mode kill (commit `e284d95`)

**`src/layouts/BaseLayout.astro`:**
- Deleted the `<script is:inline>` block (FOUC guard + `astro:after-swap` listener that wrote `data-theme="light"` based on `localStorage.getItem("theme")`)
- Updated `<body>` class from `bg-bg-primary text-text-primary font-body ...` → `bg-bg text-ink font-body ...`

**`src/styles/global.css`:**
- Deleted the `[data-theme="light"]` oklch override block (12 token overrides)
- Deleted the `html.theme-transitioning *` rule block + its `@media (prefers-reduced-motion: reduce)` override
- Deleted the `:root, [data-theme="light"]` print override block inside `@media print` (9 `--token-*` color overrides)

Net: 2 files changed, 1 insertion, 81 deletions.

### Task 2 — GSAP + ClientRouter kill (commit `c5d0911` — atomic per phase constraint #1, #2)

**`src/scripts/animations.ts`:** DELETED entirely.

**`src/scripts/chat.ts` (surgical edits only, file NOT rewritten):**
- Deleted `const prefersReducedMotion` helper (only used by deleted GSAP helpers)
- Deleted `let pulseAnimation: gsap.core.Tween | null = null;`
- Replaced 6 GSAP helpers with no-op stubs that still satisfy the `Promise<void>` call-site contract:
  - `animatePanelOpen(panel)` → `panel.style.display = "flex"`
  - `animatePanelClose(panel)` → `panel.style.display = "none"`
  - `animateMessageAppear(_el)` → no-op
  - `startPulse(_bubble)` → no-op
  - `stopPulse()` → no-op
  - `startTypingDots(container)` → sets `.typing-dot { animation: none; opacity: 0.5 }` (CSS fallback)
- Renamed char-count color assignments (per D-28):
  - `var(--token-destructive)` → `var(--accent)` (500-char band)
  - `var(--token-warning)` → `var(--accent)` (450-char band)
  - `var(--token-text-muted)` → `var(--ink-faint)` (default band)
- Renamed ALL other inline `var(--token-*)` refs across message-creation helpers (createUserMessageEl, createBotMessageEl, createErrorMessageEl, createNudgeMessageEl) per D-19 + D-27:
  - `--token-bg-secondary` → `--rule`
  - `--token-text-primary` → `--ink`
  - `--token-text-secondary` → `--ink-muted`
  - `--token-text-muted` → `--ink-faint`
  - `--token-border` → `--rule`
  - `--token-text-base` → `1rem` (flat per D-08)
  - `--token-text-sm` → `0.875rem` (flat per D-08)
- Deleted the `astro:before-preparation` focus-trap cleanup listener (dead without ClientRouter)
- KEPT (Phase 7 carry-over): `marked.use`, `PURIFY_CONFIG`, `DOMPurify.addHook`, `renderMarkdown` export, `streamChat` + `AbortController` 30s timeout, `setupFocusTrap`, `trackChatEvent`, `chatInitialized + panel.dataset.chatBound` guard, `DOMContentLoaded` fallback at line 740-742, defensive `astro:page-load` listener at line 736

**`src/components/chat/ChatWidget.astro`:**
- Removed `transition:persist` directive from `.chat-widget` root div
- Updated stale header comment from "Uses transition:persist to survive page navigation (D-07)" → "Phase 8: transition:persist removed with ClientRouter (D-29)..."

**`src/components/MobileMenu.astro`:**
- Replaced single `document.addEventListener("astro:page-load", initMobileMenu)` with dual-path init (per D-30):
  1. If `document.readyState !== "loading"` → call `initMobileMenu()` immediately
  2. Else → `addEventListener("DOMContentLoaded", initMobileMenu)`
  3. Defensively keep `addEventListener("astro:page-load", initMobileMenu)` so Phase 10 can re-introduce ClientRouter without re-editing the init path

**`src/layouts/BaseLayout.astro`:**
- Deleted `import { ClientRouter } from "astro:transitions";` (line 4)
- Deleted `<ClientRouter />` (line 97)
- Changed `<ChatWidget transition:persist />` → `<ChatWidget />`
- Deleted the entire `<script>` block (astro:page-load GSAP import, astro:before-preparation cleanup, setTimeout [data-animate] reveal fallback)

**`package.json` + `pnpm-lock.yaml`:**
- Ran `pnpm remove gsap` → `"gsap": "^3.14.2"` removed from dependencies, pnpm-lock.yaml regenerated

Net: 7 files changed, 38 insertions, 261 deletions.

### Task 3 — global.css motion surgery (commit `d61b34e`)

**`src/styles/global.css`:**
- Deleted the `[data-animate]` pre-animation stub block + its `@media (prefers-reduced-motion: reduce)` override (4 selectors each, 23 lines)
- Updated `body { ... }` base rule to use new hex-token vocabulary:
  - `font-size: var(--token-text-base)` → `font-size: 1rem`
  - `color: var(--token-text-primary)` → `color: var(--ink)`
  - `background-color: var(--token-bg-primary)` → `background-color: var(--bg)`
- Deleted the `::view-transition-old/new(root)` keyframes block, `vt-fade-out` / `vt-fade-in` keyframe definitions, and their `@media (prefers-reduced-motion: reduce)` override (26 lines)
- Preserved `.nav-link-hover` rule and its reduced-motion override (D-13 survivor)
- Preserved `.chat-*` rules that still reference old `--token-*` vars — Plan 05 owns those

Net: 1 file changed, 3 insertions, 54 deletions.

## Atomic Commit Confirmation

Task 2 landed in a single commit (`c5d0911`) as required by phase_specific_planning_constraints #1 and #2. The seven files (`animations.ts` deletion, `chat.ts`, `MobileMenu.astro`, `ChatWidget.astro`, `BaseLayout.astro`, `package.json`, `pnpm-lock.yaml`) were staged together before a single `git commit` call.

```
$ git log --oneline -3
d61b34e feat(08-03): remove [data-animate] stubs, view transitions, update body base
c5d0911 feat(08-03): remove GSAP, ClientRouter, motion machinery (atomic)
e284d95 feat(08-03): kill dark mode FOUC script and [data-theme] overrides
```

## Chat Regression Acknowledgment (D-27, D-29)

After this plan, the chat widget is functional but visibly degraded:

- **Chat bubble no longer pulses** — the `startPulse` no-op leaves the bubble static. No GSAP tween animates the `boxShadow` ring.
- **Panel no longer scales in/out** — `animatePanelOpen` and `animatePanelClose` simply flip `display: flex / none`. No scale-from-bottom-right transform, no opacity fade.
- **Typing dots no longer bounce** — `startTypingDots` sets `animation: none; opacity: 0.5;` on each `.typing-dot`. They appear as three static faded circles.
- **Chat does not persist across page navigations** — `transition:persist` was removed with `ClientRouter`. Every full-page navigation destroys the chat panel DOM and message history. This is descoped per **D-29** (CHAT-01 moved from Phase 8 to Phase 10).

Restoration of chat motion is planned for **Phase 10 CHAT-02** per D-27. The in-memory chat functionality (streaming, markdown rendering, XSS sanitization, focus trap, idempotency guard, rate-limited send, error messages, copy-to-clipboard, nudge system) is all preserved.

## MobileMenu Fallback Pattern (D-30)

Without ClientRouter, `astro:page-load` never fires. MobileMenu.astro now uses a dual-path initialization to guarantee `initMobileMenu()` runs on every full-page load:

```js
if (document.readyState !== "loading") {
  initMobileMenu();
} else {
  document.addEventListener("DOMContentLoaded", initMobileMenu);
}
// Defensive: harmless without ClientRouter, re-introducing ClientRouter in Phase 10 works without re-adding this listener
document.addEventListener("astro:page-load", initMobileMenu);
```

The same pattern is preserved in `src/scripts/chat.ts:736-742` (already existed from Phase 7).

## Acceptance Criteria Verification

### Task 1
- `grep -c 'data-theme' src/layouts/BaseLayout.astro` = 0
- `grep -c 'localStorage.getItem("theme")' src/layouts/BaseLayout.astro` = 0
- `grep -c 'astro:after-swap' src/layouts/BaseLayout.astro` = 0
- `grep -c 'prefers-color-scheme' src/layouts/BaseLayout.astro` = 0
- `grep -c 'class="bg-bg text-ink font-body' src/layouts/BaseLayout.astro` = 1
- `grep -c 'bg-bg-primary' src/layouts/BaseLayout.astro` = 0
- `grep -c 'data-theme' src/styles/global.css` = 0
- `grep -c 'theme-transitioning' src/styles/global.css` = 0
- `grep -c 'localStorage' src/styles/global.css` = 0

### Task 2
- `test -e src/scripts/animations.ts` → exit 1 (deleted)
- `grep -c '"gsap"' package.json` = 0
- `grep -rn 'import.*gsap' src/ | wc -l` = 0
- `grep -rn 'gsap\.' src/ | wc -l` = 0
- `grep -c 'gsap.core.Tween' src/scripts/chat.ts` = 0
- `grep -c 'pulseAnimation' src/scripts/chat.ts` = 0
- `grep -c 'import("gsap")' src/scripts/chat.ts` = 0
- `grep -c 'No-op: no pulse' src/scripts/chat.ts` = 1
- `grep -c -- '--token-' src/scripts/chat.ts` = 0 (entire token namespace purged)
- `grep -c 'var(--accent)' src/scripts/chat.ts` = 2 (500-char + 450-char bands)
- `grep -c 'var(--ink-faint)' src/scripts/chat.ts` ≥ 1 (default char count + other uses)
- `grep -c 'renderMarkdown' src/scripts/chat.ts` ≥ 2 (Phase 7 carry-over preserved)
- `grep -c 'PURIFY_CONFIG' src/scripts/chat.ts` ≥ 2 (Phase 7 carry-over preserved)
- `grep -c 'AbortController' src/scripts/chat.ts` ≥ 1 (Phase 7 carry-over preserved)
- `grep -c 'DOMContentLoaded' src/components/MobileMenu.astro` = 2 (comment + listener)
- `grep -c 'document.readyState' src/components/MobileMenu.astro` = 1
- `grep -c 'astro:page-load' src/components/MobileMenu.astro` = 1 (defensive listener kept)
- ChatWidget: `transition:persist` directive removed (line 8); only remaining match is the updated header comment (line 4)
- `grep -c 'ClientRouter' src/layouts/BaseLayout.astro` = 0
- `grep -c 'initAnimations' src/layouts/BaseLayout.astro` = 0
- `grep -c 'setTimeout' src/layouts/BaseLayout.astro` = 0

### Task 3
- `grep -c 'data-animate' src/styles/global.css` = 0
- `grep -c 'view-transition' src/styles/global.css` = 0
- `grep -c 'vt-fade' src/styles/global.css` = 0
- `grep -c 'Pre-Animation States' src/styles/global.css` = 0
- `grep -c -- '--token-text-base' src/styles/global.css` = 0
- `grep -c -- '--token-bg-primary' src/styles/global.css` = 0
- `grep -c 'color: var(--ink);' src/styles/global.css` ≥ 1
- `grep -c 'background-color: var(--bg);' src/styles/global.css` ≥ 1
- `grep -c 'nav-link-hover' src/styles/global.css` ≥ 1 (D-13 survivor)
- `grep -c '\.chat-' src/styles/global.css` ≥ 1 (Plan 05 still owns)

One `--token-text-primary` reference remains in `.hover-text-primary:hover { color: var(--token-text-primary) !important; }` at line 285 — this is inside the `.chat-*` rule block which Plan 05 owns per the plan's explicit boundary.

## Deviations from Plan

### [Rule 3 — Blocking] pnpm not npm

**Found during:** Task 2 Edit F
**Issue:** The plan specified running `npm uninstall gsap` and staging `package-lock.json`. The project actually uses pnpm (there is no `package-lock.json`, only `pnpm-lock.yaml`). Running `npm uninstall gsap` failed with `Cannot read properties of null (reading 'matches')` because npm cannot handle the pnpm workspace layout.
**Fix:** Ran `pnpm remove gsap` instead. This cleanly removed the `"gsap": "^3.14.2"` dependency from `package.json` and regenerated `pnpm-lock.yaml`. Both files were staged in the Task 2 atomic commit.
**Files modified:** package.json, pnpm-lock.yaml (instead of package.json + package-lock.json)
**Commit:** c5d0911

### Stale comment updates (housekeeping)

**Found during:** Task 2
**Issue:** After removing `transition:persist` from `ChatWidget.astro`, the file's header comment still claimed "Uses transition:persist to survive page navigation (D-07)", which is now false.
**Fix:** Updated the comment to reflect the Phase 8 reality ("Phase 8: transition:persist removed with ClientRouter (D-29) — cross-page chat persistence descoped to Phase 10 CHAT-01").
**Files modified:** src/components/chat/ChatWidget.astro
**Commit:** c5d0911

No other deviations — plan executed as written. No architectural changes, no scope expansion.

## Known Red State (expected)

Per the plan's explicit guidance, the build is still red after this plan. Remaining issues resolved by later plans in Phase 8:

- `.chat-*` rules in `src/styles/global.css` still reference `--token-text-primary`, `--token-text-muted`, `--token-border`, `--token-accent`, `--token-bg-secondary`, `--token-space-md`, `--token-text-sm`, `--font-code`, `--token-border-hover`, `--token-success` → **Plan 05** owns chat CSS rebrand.
- `src/components/ChatWidget.astro` inline styles still reference `--token-*` and `--font-body/code` → Plan 05 owns chat template restyle.
- `src/components/Header.astro`, `src/components/MobileMenu.astro` inline classes still use `bg-bg-primary`, `text-text-primary`, `text-text-muted`, `[length:var(--token-text-heading)]` → **Plan 04** owns Header restyle + MobileMenu class rename + /resume navLinks removal.
- `src/components/CanvasHero.astro` and `src/components/ThemeToggle.astro` still exist and reference `data-theme` — these are v1.0 artifacts scheduled for deletion in **Plan 04** (CanvasHero) and Plan 04/05 (ThemeToggle).
- `src/pages/*.astro` still use old token class names → **Plan 06** (page stubs + component cascade).

`npm run build` / `astro check` are NOT run in this plan per `<verification>` and per phase constraint #3. Plan 08 is the phase-wide build gate.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | `e284d95` | feat(08-03): kill dark mode FOUC script and [data-theme] overrides |
| 2 | `c5d0911` | feat(08-03): remove GSAP, ClientRouter, motion machinery (atomic) |
| 3 | `d61b34e` | feat(08-03): remove [data-animate] stubs, view transitions, update body base |

## Self-Check: PASSED

- FOUND: src/layouts/BaseLayout.astro (modified in e284d95, c5d0911)
- FOUND: src/styles/global.css (modified in e284d95, d61b34e)
- FOUND: src/scripts/chat.ts (modified in c5d0911)
- FOUND: src/components/MobileMenu.astro (modified in c5d0911)
- FOUND: src/components/chat/ChatWidget.astro (modified in c5d0911)
- FOUND: package.json (modified in c5d0911 — gsap removed)
- FOUND: pnpm-lock.yaml (modified in c5d0911 — gsap subtree removed)
- MISSING (intentionally): src/scripts/animations.ts (deleted in c5d0911)
- FOUND commit: e284d95
- FOUND commit: c5d0911
- FOUND commit: d61b34e
- `grep -rn 'import.*gsap' src/` returns 0 matches: FOUND
- `pnpm ls gsap` returns empty: FOUND
- DSGN-03 (dark mode removal) structurally complete: FOUND
- DSGN-04 (motion removal) structurally complete: FOUND
- Phase 7 chat carry-over preserved (marked async:false, PURIFY_CONFIG, AbortController, focus trap, chatInitialized guard, renderMarkdown export): FOUND
