---
phase: 12-tech-debt-sweep
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/primitives/MobileMenu.astro
  - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md
autonomous: true
requirements:
  - DEBT-02
user_setup: []
tags:
  - a11y
  - inert
  - focus-trap
  - mobile-menu
must_haves:
  truths:
    - "Opening the mobile menu sets `inert` on the `.chat-widget` root (in addition to header/main/footer)"
    - "Closing the mobile menu removes `inert` from `.chat-widget`"
    - "While the mobile menu is open, Tab never lands on the chat bubble or any interactive chat widget descendant"
    - "While the mobile menu is open, keyboard focus remains trapped inside `.mobile-menu` subtree across 30+ Tab presses (D-11 scripted check)"
    - "Escape key still closes the menu (D-10 focus-trap keydown handler preserved verbatim)"
    - "Closing the menu restores tab order and interactivity to the chat widget"
  artifacts:
    - path: "src/components/primitives/MobileMenu.astro"
      provides: "openMenu() and closeMenu() extend inert set/remove to .chat-widget; focus-trap handler preserved"
      contains: 'document.querySelector(".chat-widget")?.setAttribute("inert", "")'
    - path: ".planning/phases/12-tech-debt-sweep/12-VALIDATION.md"
      provides: "Manual keyboard-cycle test steps + D-26 Chat Regression Gate pass evidence"
      contains: "DEBT-02 Manual Keyboard Cycle Test"
  key_links:
    - from: "MobileMenu.astro openMenu()"
      to: ".chat-widget root in BaseLayout-level DOM"
      via: "document.querySelector('.chat-widget').setAttribute('inert', '')"
      pattern: 'querySelector\\(".chat-widget"\\)\\?\\.setAttribute\\("inert"'
    - from: "MobileMenu.astro closeMenu()"
      to: ".chat-widget root"
      via: "removeAttribute('inert')"
      pattern: 'querySelector\\(".chat-widget"\\)\\?\\.removeAttribute\\("inert"'
---

<objective>
Close DEBT-02 by extending the already-shipped `inert` set/remove pair in `MobileMenu.astro` openMenu / closeMenu (which currently covers `<header>` / `<main>` / `<footer>`) to also cover the `.chat-widget` body-level sibling. The focus-trap keydown handler stays as belt-and-suspenders per D-10. Run the D-26 Chat Regression Gate because this plan indirectly touches the BaseLayout-adjacent ChatWidget mount surface.

Purpose: With mobile menu open, the chat bubble currently remains tabbable / clickable behind the backdrop. Adding `inert` to `.chat-widget` closes the middle-element focus-trap edge case the v1.1 WR-01 audit flagged, and the focus-trap handler stays as a fallback for older mobile Safari (<15.5) and Firefox (<112) that lack `inert` support (per D-10 + RESEARCH.md §Q2).

Output: MobileMenu.astro extends inert to `.chat-widget`; manual keyboard-cycle test documented in 12-VALIDATION.md; D-26 chat regression battery passes; Lighthouse gate holds.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-RESEARCH.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md
@.planning/phases/12-tech-debt-sweep/12-VALIDATION.md

<interfaces>
<!-- ChatWidget root selector (confirmed at src/components/chat/ChatWidget.astro:9) -->
```astro
<div class="chat-widget" data-no-print>
  <!-- chat bubble + panel -->
</div>
```

<!-- Existing inert pattern at MobileMenu.astro:267-291 (to be extended) -->
```ts
// openMenu() currently has these three lines (PATTERNS.md):
document.querySelector("header")?.setAttribute("inert", "");
document.querySelector("main")?.setAttribute("inert", "");
document.querySelector("footer")?.setAttribute("inert", "");

// closeMenu() currently has the removeAttribute mirrors (PATTERNS.md):
document.querySelector("header")?.removeAttribute("inert");
document.querySelector("main")?.removeAttribute("inert");
document.querySelector("footer")?.removeAttribute("inert");
```

<!-- Focus-trap handler at MobileMenu.astro:293-317 — PRESERVE PER D-10 -->
```ts
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") { closeMenu(); return; }
  if (e.key !== "Tab") return;
  const focusable = menu.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  // …first/last boundary bounce…
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Extend inert set/remove in MobileMenu.astro to cover .chat-widget</name>
  <read_first>
    - src/components/primitives/MobileMenu.astro (full file, focus on openMenu and closeMenu functions and the handleKeyDown handler)
    - src/components/chat/ChatWidget.astro (confirm root class remains `chat-widget`)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md section "src/components/primitives/MobileMenu.astro — extend inert set/remove to ChatWidget"
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-09, D-10, D-11, D-12
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §Q2 (inert browser compat)
  </read_first>
  <action>
    Locate the three `setAttribute("inert", "")` calls inside `openMenu()` (per PATTERNS.md, around MobileMenu.astro:271-273). Immediately after the `footer` line, add a fourth line:
    ```ts
    document.querySelector(".chat-widget")?.setAttribute("inert", "");
    ```

    Locate the three mirror `removeAttribute("inert")` calls inside `closeMenu()` (around MobileMenu.astro:286-288). Immediately after the `footer` line, add a fourth line:
    ```ts
    document.querySelector(".chat-widget")?.removeAttribute("inert");
    ```

    DO NOT modify the `handleKeyDown` function (MobileMenu.astro:293-317) — it stays verbatim per D-10 (belt-and-suspenders for <inert-support browsers, preserves D-08 per-Tab re-query invariant).

    DO NOT change the existing comment block above the inert lines (the `// WR-01:` comment explaining the inert pattern). Optionally extend it with a one-line append about chat widget coverage, but the exact prose of the existing comment must remain intact.

    **Claude's Discretion resolution (CONTEXT.md D-12 / planner_guidance Q2):** `.chat-widget` is the ROOT of both the bubble and any expanded panel, so a single `inert` on `.chat-widget` covers BOTH states (panel-closed AND panel-open). Document this decision in the task SUMMARY: "Inert applied to `.chat-widget` root — covers both bubble-only and panel-open states; no separate selector needed."
  </action>
  <verify>
    <automated>grep -c 'querySelector(".chat-widget")?.setAttribute("inert"' src/components/primitives/MobileMenu.astro</automated>
    <automated>grep -c 'querySelector(".chat-widget")?.removeAttribute("inert"' src/components/primitives/MobileMenu.astro</automated>
    <automated>grep -c "handleKeyDown" src/components/primitives/MobileMenu.astro</automated>
    <automated>pnpm test -- --run --reporter=dot</automated>
    <automated>pnpm build</automated>
  </verify>
  <acceptance_criteria>
    - `grep 'querySelector(".chat-widget")?.setAttribute("inert"' src/components/primitives/MobileMenu.astro` returns exactly 1 match (inside openMenu)
    - `grep 'querySelector(".chat-widget")?.removeAttribute("inert"' src/components/primitives/MobileMenu.astro` returns exactly 1 match (inside closeMenu)
    - `grep 'querySelector("header")?.setAttribute("inert"' src/components/primitives/MobileMenu.astro` still returns 1 match (existing pattern preserved)
    - `grep 'querySelector("main")?.setAttribute("inert"' src/components/primitives/MobileMenu.astro` still returns 1 match
    - `grep 'querySelector("footer")?.setAttribute("inert"' src/components/primitives/MobileMenu.astro` still returns 1 match
    - `grep "function handleKeyDown" src/components/primitives/MobileMenu.astro` returns 1 match (preserved)
    - `grep "e.key === \"Escape\"" src/components/primitives/MobileMenu.astro` returns 1 match (Escape handler preserved)
    - `pnpm test -- --run` exits 0 with zero failures
    - `pnpm build` exits 0 with zero warnings
  </acceptance_criteria>
  <done>MobileMenu.astro extends inert coverage to `.chat-widget`; focus-trap handler preserved verbatim; build + existing tests green.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual keyboard-cycle + D-26 Chat Regression Gate verification</name>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md "Manual-Only Verifications" table
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §"D-26 Chat Regression Gate Checklist" (lines 333-375)
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-11, D-12
  </read_first>
  <what-built>
    `.chat-widget` is now added to the inert set/remove pair inside `MobileMenu.astro` openMenu / closeMenu. Focus-trap handleKeyDown handler (D-10 belt-and-suspenders) is preserved verbatim. Browser smoke test must confirm (a) chat bubble is unreachable via keyboard while menu is open, (b) the focus-trap fallback still fires, (c) the full Phase 7 chat regression battery still passes (D-26 gate).
  </what-built>
  <action>See &lt;how-to-verify&gt; block below — this is a checkpoint:human-verify task; the executor pauses the automation for the developer to run the manual keyboard-cycle test and the D-26 Chat Regression Gate manual-smoke battery, then records results in 12-VALIDATION.md.</action>
  <how-to-verify>
    **Part A — Keyboard-cycle test (DEBT-02 per D-11):**
    1. Start preview: `pnpm dev` (or `pnpm preview` after `pnpm build`)
    2. Open Chrome/Safari on mobile viewport (or narrow desktop <768px so MobileMenu is visible)
    3. Navigate to `/projects` (rich background — 6 WorkRows + footer social links + chat bubble)
    4. Open DevTools Console. Paste:
       ```js
       setInterval(() =&gt; console.log(document.activeElement?.className || document.activeElement?.tagName), 200);
       ```
    5. Click the mobile menu trigger to open the menu
    6. Press Tab 30 times
    7. Observe console log: `document.activeElement` MUST stay inside `.mobile-menu` subtree — never log `chat-widget`, `chat-bubble`, `chat-panel`, `workrow`, `footer`, or anything from the main document
    8. Press Shift+Tab 30 times — same assertion
    9. Press Escape — menu closes, focus returns to the trigger button (assert no console errors)
    10. Open menu again. Inspect `document.querySelector(".chat-widget").getAttribute("inert")` in console — must return `""` (empty string, inert set)
    11. Close menu. Inspect again — must return `null` (inert removed)

    **Part B — D-26 Chat Regression Gate (paste into 12-VALIDATION.md):**
    Run full checklist from 12-RESEARCH.md lines 337-367. Automated portion:
    ```
    pnpm test 2&gt;&amp;1 | tee /tmp/12-02-tests.log
    ```
    Expect exits 0, all tests in `tests/client/markdown.test.ts`, `tests/api/chat.test.ts`, `tests/api/security.test.ts` pass.

    Manual smoke (preview deploy or production):
    - Open chat panel — focus lands in input, Tab cycles inside panel
    - Send message — SSE stream renders tokens live, typing indicator visible
    - Kill network mid-stream — 30s AbortController fires, error rendered, panel still usable
    - Send 6 messages rapid-fire — 6th rejected with rate-limit error
    - Close/reopen chat — localStorage replay renders history with correct role styling
    - Bot reply with markdown — bold/italic/lists/code/links render via DOMPurify strict
    - Live-stream bot message: click COPY → flips to COPIED → reverts 1s later
    - Replayed bot message: identical markup + behavior to live stream
    - Double-click COPY in 1s window — only one transition (idempotency guard)
    - Tab 20+ times inside chat panel — activeElement stays in panel subtree

    **Part C — Phase 12 specific D-26 additions (per 12-RESEARCH.md:362-365):**
    - Open mobile menu while chat panel CLOSED — chat bubble is inert (Tab skips; `aria-hidden` via inert)
    - Open mobile menu while chat panel OPEN — document outcome (expected: entire `.chat-widget` root becomes inert per Task 1 Claude's-discretion note; panel is visually still visible but not tabbable)
    - Close mobile menu — chat bubble + panel regain tab order and interactivity

    **Part D — Lighthouse gate:**
    Run Lighthouse CI on homepage + one project detail. Expect Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100.

    **Record all results** in `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` under a new `## D-26 Chat Regression Gate` section with timestamp, commit SHA (HEAD after Task 1), and one-line verdict per bullet.
  </how-to-verify>
  <verify><automated>pnpm test -- --run; pnpm build; pnpm lint</automated></verify>
  <resume-signal>Type "approved" once all three parts pass and 12-VALIDATION.md is updated with pass evidence, or describe any regression.</resume-signal>
  <acceptance_criteria>
    - 12-VALIDATION.md contains a new `## D-26 Chat Regression Gate — Plan 12-02` section with timestamp + commit SHA
    - Keyboard-cycle test: 30 Tab + 30 Shift+Tab confirm focus never leaves `.mobile-menu` subtree
    - Inert attribute state inspection confirmed: set on open, removed on close
    - `pnpm test` full suite exits 0
    - All 11 D-26 manual smoke items verified PASS
    - All 3 Phase-12-specific D-26 items verified PASS (bubble inert when closed, panel inert when open, restoration on close)
    - Lighthouse: homepage + one project detail ≥99/95/100/100
  </acceptance_criteria>
  <done>DEBT-02 closed: chat widget inert while menu open, focus trap fallback preserved, D-26 gate all-green, Lighthouse held.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| keyboard input → DOM focus | Mobile-menu dialog must contain focus; inert attribute enforces this at the a11y tree level |
| client JS lifecycle | openMenu/closeMenu toggle inert; failure to mirror the toggle leaves body in an inconsistent state |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-02-01 | Denial of service | MobileMenu focus trap | mitigate | Task 1 preserves the existing `handleKeyDown` Escape-key branch verbatim. Task 2 manual smoke explicitly tests Escape → menu closes. If `inert` were so aggressive that Escape could not close the menu, users would be trapped. The D-10 belt-and-suspenders keydown handler exists precisely for this case (older browsers without inert support). Severity: Low. |
| T-12-02-02 | Tampering | inert state leak | mitigate | Task 1 mirrors setAttribute in openMenu with removeAttribute in closeMenu for `.chat-widget` symmetrically. Task 2 Part A step 11 verifies `.chat-widget` attribute is `null` (removed) after close. Any mismatch between open/close branches would leave chat widget permanently inert. Severity: Medium. |
| T-12-02-03 | Information disclosure | Chat widget bubble in a11y tree | accept | The chat widget is already marked `data-no-print` but is intentionally visible on screen. Making it inert while menu is open is a UX improvement (closes WR-01 middle-element edge case) — not a security threat. Severity: N/A (feature, not threat). |
| T-12-02-04 | Elevation of privilege | D-26 regression surface | mitigate | Task 2 runs full D-26 Chat Regression Gate — XSS sanitization, CORS exact-origin, 5/60s rate limit, 30s AbortController, focus trap re-query, localStorage persistence, SSE streaming, DOMPurify strict, clipboard idempotency. Evidence recorded in 12-VALIDATION.md. Severity: Medium (blocking if any gate item fails). |
</threat_model>

<verification>
Plan-level sign-off requires:
- Automated: `pnpm test -- --run`, `pnpm build`, `pnpm lint` all exit 0 with zero warnings
- Manual: 12-VALIDATION.md §D-26 Chat Regression Gate section populated with timestamp + commit SHA + per-bullet verdicts
- Keyboard-cycle test evidence (30 Tab + 30 Shift+Tab) captured
- Lighthouse 99/95/100/100 on homepage + one project detail
- D-26 Chat Regression Gate (per 12-RESEARCH.md §D-26) ALL GREEN — this plan touches MobileMenu which manages DOM state adjacent to the ChatWidget mount, so the gate applies per ROADMAP.md Cross-Phase Constraints
</verification>

<success_criteria>
- `.chat-widget` root gets `inert` attribute set when mobile menu opens and removed when it closes
- Focus-trap handleKeyDown handler is byte-for-byte unchanged from pre-plan state (D-10)
- Keyboard users cannot Tab or Shift+Tab into the chat bubble, header, main, or footer while mobile menu is open
- Escape key still closes the menu
- D-26 Chat Regression Gate all-green (recorded in 12-VALIDATION.md)
- Lighthouse Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-02-SUMMARY.md` with:
- Diff excerpt of MobileMenu.astro showing the 2 added lines (set + remove for `.chat-widget`)
- Claude's-discretion resolution for Q2 (chat panel scope): documented as ".chat-widget root covers both states"
- Reference to 12-VALIDATION.md §D-26 section populated with gate evidence
- Lighthouse score table
- Confirmation that handleKeyDown is byte-identical to pre-plan state (git blame line range unchanged)
</output>
