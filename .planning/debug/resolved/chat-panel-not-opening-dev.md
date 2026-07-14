---
status: resolved
trigger: "the chatbot sidebar isnt even popping up"
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z
---

## Current Focus

hypothesis: CSS specificity defeat — DEBT-05 moved the chat-panel display state machine into global.css (`#chat-panel { display: none }` base + `#chat-panel.is-open { display: flex }`) without adding `!important`, AND removed the imperative `panel.style.display = "flex"/"none"` from chat.ts. The pre-existing inline `style="display: none; ..."` on the `<div id="chat-panel">` in `src/components/chat/ChatWidget.astro:55` has higher specificity than any selector-based stylesheet rule, so when chat.ts adds `.is-open` the inline `display: none` still wins. This is a NEW regression because the OLD chat.ts unconditionally overwrote `style.display="flex"` (specificity tie at the same level — last write wins).
test: production HTML curl + production CSS curl + production JS bundle curl + git log against origin/main.
expecting: production HTML contains the same inline `display: none` (it does); production CSS lacks `display: none/flex` for `#chat-panel` (it does); production JS bundle still contains `style.display="flex"` (it does); local repo is N commits ahead of origin/main (23 commits — DEBT-05 has not shipped).
next_action: return ROOT CAUSE FOUND structured diagnosis. Do NOT apply fix.

## Symptoms

expected: clicking the chat bubble on `pnpm dev` (http://localhost:4321/) opens the chat panel with a 180ms scale-in animation, mirroring production at https://jackcutrara.com/.
actual: clicking the chat bubble does nothing visible. No panel mount, no scale-in, no console error reported by user.
errors: none reported by user (no client-side throw — bubble click handler runs, `.is-open` class is added, but the panel stays hidden).
reproduction: `pnpm install && pnpm dev` → open http://localhost:4321/ → click red bubble at bottom-right. Production at https://jackcutrara.com/ behaves correctly with the same DOM markup.
started: After Phase 17 Plan 17-03 DEBT-05 (commit 1c148c9, "refactor(17-03): DEBT-05 — CSS-only #chat-panel display state machine"). Local repo is 23 commits ahead of origin/main; DEBT-05 has never been deployed.

## Eliminated

- hypothesis: Initial-load timing — `addEventListener('astro:page-load', initChat)` registers AFTER the initial event fires in dev.
  evidence: `src/scripts/chat.ts:982-987` includes a `DOMContentLoaded`-or-immediate fallback (`if (document.readyState !== "loading") initChat()`). Even if `astro:page-load` is missed, initChat WILL run. User did not report bubble being unclickable — the click handler IS attached; it just has no visible effect. The bubble click would do nothing if init never ran (panelOpen toggling is closure-local). Eliminated.
  timestamp: 2026-05-10T00:00:00Z

- hypothesis: `typeof document !== "undefined"` guard skips registration during SSR.
  evidence: chat.ts is imported via a `<script>` tag (NOT `is:inline`) in ChatWidget.astro:184-186. Astro processes such scripts as client-side modules — they never execute in the SSR environment. The `typeof document` guard is always `true` at module evaluation in the browser. Same pattern lives in analytics.ts (lines 148-157) and scroll-depth.ts (lines 88-97), both of which work in dev. Eliminated.
  timestamp: 2026-05-10T00:00:00Z

- hypothesis: Stale `dist/` shadowing dev.
  evidence: Astro's Vite dev server serves from `src/` directly; `dist/` is irrelevant under `astro dev`. Eliminated.
  timestamp: 2026-05-10T00:00:00Z

- hypothesis: Click handler attached to wrong element / never attached.
  evidence: `src/scripts/chat.ts:710-716` attaches the bubble click handler inside `initChat()`. The function calls `openPanel()`, which calls `$panel.classList.add("is-open")` at line 620. If the handler weren't attached, no class would be added. The user reports no panel — but did not report the bubble being unresponsive. The handler IS firing; the result is just invisible. Eliminated.
  timestamp: 2026-05-10T00:00:00Z

## Evidence

- timestamp: 2026-05-10T00:00:00Z
  checked: `src/components/chat/ChatWidget.astro:55`
  found: `<div id="chat-panel" style="display: none; position: fixed; bottom: 84px; right: 24px; z-index: 50; width: 400px; height: 500px; background: var(--bg); border: 1px solid var(--rule); border-radius: 0; box-shadow: none; flex-direction: column; overflow: hidden;" role="dialog" ...>`
  implication: Inline `display: none` is set as part of the panel's `style` attribute alongside its layout positioning. Inline-style declarations have specificity (1,0,0,0) and beat ANY selector-based stylesheet rule that does not use `!important`.

- timestamp: 2026-05-10T00:00:00Z
  checked: `src/styles/global.css:699-706`
  found: `#chat-panel { display: none; transform-origin: bottom right; }` and `#chat-panel.is-open { display: flex; }` — neither rule uses `!important`.
  implication: Selector-based rule specificity is (0,1,1,0) for `#chat-panel.is-open`. Loses to the inline-style declaration. The CSS rule is therefore inert against the inline `display: none`.

- timestamp: 2026-05-10T00:00:00Z
  checked: `src/scripts/chat.ts:615-708` (openPanel + closePanel)
  found: `openPanel()` calls `$panel.classList.add("is-open")` at line 620. `closePanel()` calls `$panel.classList.remove("is-open")` at line 694. Neither function writes `panel.style.display`. The Phase 17 DEBT-05 cleanup deleted those lines.
  implication: After DEBT-05, the only mechanism chat.ts uses to make the panel visible is the `.is-open` class. That mechanism cannot defeat the inline `display: none` on the panel element.

- timestamp: 2026-05-10T00:00:00Z
  checked: `tests/client/chat-panel-display.test.ts:20-29`
  found: The DEBT-05 test fixture uses `<div id="chat-panel"></div>` with NO inline style attribute. The CSS-cascade assertion (`getComputedStyle(panel).display === "flex"`) passes only because there is no inline declaration competing.
  implication: The test never exercised the real-world DOM that ChatWidget.astro emits. The test is internally consistent but does not validate the integration with the live component markup. False-green coverage.

- timestamp: 2026-05-10T00:00:00Z
  checked: live production HTML — `curl -s https://jackcutrara.com/ | grep 'id="chat-panel"'`
  found: The production HTML emits the IDENTICAL inline `style="display: none; ..."` on `#chat-panel`.
  implication: ChatWidget.astro's inline `display: none` is in production too. The contrast between dev (broken) and prod (working) is NOT explained by the inline style. Something else differs.

- timestamp: 2026-05-10T00:00:00Z
  checked: live production CSS — `curl -s https://jackcutrara.com/_astro/Container.SVSAkO-g.css | grep '#chat-panel'`
  found: Production stylesheet contains ONLY: `#chat-panel{transform-origin:100% 100%}` and `#chat-panel.is-open{animation:.18s ease-out forwards chat-panel-scale-in}`. No `display: none` and no `display: flex` rules for `#chat-panel`.
  implication: Production was deployed BEFORE the DEBT-05 CSS changes landed. Production CSS is the pre-DEBT-05 version with no display state machine in CSS — the panel is hidden purely by the inline style and shown purely by the imperative JS write.

- timestamp: 2026-05-10T00:00:00Z
  checked: live production chat bundle — `curl -s https://jackcutrara.com/_astro/ChatWidget.astro_astro_type_script_index_0_lang.cFaSnvkL.js | grep -o '\\.style\\.display="flex"'`
  found: Production bundle contains `G.style.display="flex"` (minified `panel.style.display = "flex"`). Two occurrences.
  implication: Production runs the PRE-DEBT-05 chat.ts which still does the imperative inline-style flip. Setting an inline `display: flex` on the same element overrides the inline `display: none` (last write wins on same-specificity inline declarations). The class toggle is cosmetic in production — the inline-style flip is what makes the panel visible.

- timestamp: 2026-05-10T00:00:00Z
  checked: `git status` — local main branch
  found: "Your branch is ahead of 'origin/main' by 23 commits." — Phase 17 Plan 17-03 (commit 1c148c9, DEBT-05) has not been deployed.
  implication: The dev/prod split is fully explained: production = pre-DEBT-05 imperative-style code; dev = post-DEBT-05 CSS-only state machine. The CSS-only state machine is broken by the pre-existing inline `display: none` that DEBT-05's planning failed to inventory. Running locally with the new code is the FIRST TIME the regression has been observable.

## Resolution

root_cause: |
  Phase 17 Plan 17-03 DEBT-05 moved the `#chat-panel` display contract from imperative JS (chat.ts: `panel.style.display = "flex"/"none"`) into a CSS state machine (global.css: `#chat-panel { display: none } / #chat-panel.is-open { display: flex }`). The CSS rules use selector-based specificity (id + class = 0,1,1,0) — they do NOT use `!important`. The pre-existing markup at `src/components/chat/ChatWidget.astro:55` declares the panel with an inline `style="display: none; ..."` attribute (mixing the visibility flag with positional layout — `position: fixed; bottom: 84px; ...`). Inline-style declarations have specificity (1,0,0,0), which beats ANY selector-based stylesheet rule without `!important`. Therefore, after DEBT-05, when `openPanel()` runs `$panel.classList.add("is-open")`, the cascade resolves `display` from the inline declaration as `none` and the CSS rule `#chat-panel.is-open { display: flex }` is ignored. The panel never becomes visible.

  Production at https://jackcutrara.com/ does not exhibit the bug because the deploy is pre-DEBT-05: the old chat.ts overwrites the inline declaration via `panel.style.display = "flex"` (same specificity layer; last write wins). The DEBT-05 commit (1c148c9) is in 23 unpushed local commits ahead of origin/main, so no production deploy has ever exercised the new CSS-only path against the real DOM.

  The DEBT-05 test (`tests/client/chat-panel-display.test.ts`) used a synthetic `<div id="chat-panel"></div>` fixture WITHOUT the ChatWidget.astro inline style attribute. The test passed in isolation but never validated against the actual component markup — false-green coverage that masked the regression at commit time.

fix: (NOT applied — diagnosis-only mode) Two viable directions, both single-file edits, both preserve production-equivalent visible behavior:
  - Option A (recommended): remove `display: none;` from the inline `style` attribute on `<div id="chat-panel">` at `src/components/chat/ChatWidget.astro:55`. The CSS cascade then governs visibility unimpeded. Caveat: removes the SSR-time guarantee that the panel is hidden BEFORE global.css parses (FOUC window of ~10-50ms in dev, near-zero in production with inlined critical CSS). To preserve the guarantee, also raise the base CSS rule's reliability — see Option B.
  - Option B: add `!important` to BOTH CSS rules at `src/styles/global.css:699-706` (`display: none !important` and `display: flex !important`). The CSS now wins against the inline declaration, AND the inline `display: none` continues to provide FOUC protection during the brief window before stylesheets parse. Slightly louder mechanism (`!important` is a code smell that future engineers will question) but more robust against accidental inline-style regressions in the markup.
  - NOT recommended: revert DEBT-05 entirely. The CSS state machine is the correct architecture; only the integration with the inline-style markup needs reconciling.

  Either fix MUST also: (a) update `tests/client/chat-panel-display.test.ts` to use a fixture matching the real ChatWidget.astro markup (inline `style="display: none"` included) so the regression cannot recur, and (b) re-run the full chat-surface battery (145/145 per Plan 17-03 SUMMARY) to confirm no other assertion regresses.

verification: (NOT applied — diagnosis-only) Manual verification path once a fix lands:
  1. `pnpm install && pnpm dev` from a clean checkout
  2. Load http://localhost:4321/
  3. Click red bubble at bottom-right
  4. EXPECT: panel appears with 180ms scale-in (no-preference) or snap-to-rest (reduce)
  5. Click bubble again or close button — panel hides cleanly
  6. Open DevTools, inspect `<div id="chat-panel">` — verify computed `display: flex` while open, `display: none` while closed
  7. Verify inline `style="display: none"` either no longer present (Option A) or overridden in DevTools cascade pane by `!important` rule (Option B)

files_changed: []

verdict: ROOT CAUSE FOUND. Returning structured diagnosis to caller. NO FIX APPLIED — diagnosis-only mode per task scope.

---

## Closeout (v1.4 milestone pre-close audit, 2026-07-14)

**Resolution:** Fixed in v1.3 Phase 17 (UAT-GAP-02) — inline display:none removed from ChatWidget.astro so the CSS #chat-panel.is-open state machine is authoritative.

_Status flipped diagnosed/investigating → resolved and archived to debug/resolved/ during the v1.4 milestone close. No open work remains._
