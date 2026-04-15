---
phase: 09-primitives
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - design-system/MASTER.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "design-system/MASTER.md §5.8 records the Phase 9 MobileMenu rebuild decision with container-query threshold 380px, overlay contents, a11y pattern, and no-entrance-animation stance"
    - "design-system/MASTER.md §5.2 documents the <768px 3-row footer stack with the GITHUB · LINKEDIN · X · EMAIL mono social row insertion"
    - "No code files are modified — this plan is a single docs-only commit"
    - "After this commit, downstream Phase 9 plans can reference the amended §5.8 and §5.2 as the locked contract"
  artifacts:
    - path: design-system/MASTER.md
      provides: Amended §5.8 (Phase 9 mobile-nav decision) and §5.2 (mobile footer stack extension)
      contains: "container-type: inline-size"
  key_links:
    - from: design-system/MASTER.md §5.8
      to: Phase 9 plan 04 (MobileMenu task)
      via: Container-query 380px threshold + overlay a11y spec + no animation stance
      pattern: "@container \\(max-width: 380px\\)"
    - from: design-system/MASTER.md §5.2
      to: Phase 9 plan 04 (Footer task)
      via: Mobile footer 3-row stack spec with social row insertion
      pattern: "GITHUB · LINKEDIN · X · EMAIL"
---

<objective>
Amend `design-system/MASTER.md` §5.8 (Phase 9 mobile-nav decision) and §5.2 (Footer.astro mobile behavior) to record the two Phase 9 decisions that expand on the v1.1 design contract. This is the ONLY sanctioned amendment to MASTER.md during Phase 9 — Phase 8 D-03 locked it at sign-off and §5.8 + §5.2 are the sanctioned amendment paths.

**Purpose:** Commit the rebuild decision to the locked spec BEFORE any primitive code is written, so every downstream plan in Phase 9 references the amended contract, not this plan's task text.

**Output:** One docs-only commit that updates MASTER.md §5.8 from "deferred" to the full D-05…D-10 rebuild decision and appends a mobile-footer subsection to §5.2 documenting the 3-row stack with social link row (D-10).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@design-system/MASTER.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Amend MASTER.md §5.8 (Phase 9 mobile-nav decision)</name>
  <files>design-system/MASTER.md</files>
  <read_first>
    - design-system/MASTER.md lines 597–601 (current §5.8 "deferred" paragraph — the replacement target)
    - design-system/MASTER.md lines 329–367 (§5.2 Footer — context for the next task; also to understand the prose style you must match)
    - .planning/phases/09-primitives/09-CONTEXT.md D-05 through D-10 (decisions being committed to the spec) and D-17 (amendment mandate)
  </read_first>
  <action>
REPLACE the existing §5.8 section in design-system/MASTER.md (currently lines ~597–601, the 5-line "deferred" paragraph under the heading `### 5.8 Phase 9 mobile-nav decision (deferred)`) with the following prose VERBATIM. Keep the heading level (H3 / three hashes) but change the heading text to `### 5.8 Mobile nav (Phase 9 rebuild decision)`.

Paste this text as the entire §5.8 body:

```markdown
### 5.8 Mobile nav (Phase 9 rebuild decision)

Phase 9 **rebuilds** `MobileMenu.astro` as a full-screen overlay primitive rather than deleting it in favor of always-visible nav links. The rebuild lives at `src/components/primitives/MobileMenu.astro`. The v1.0 `src/components/MobileMenu.astro` (233 lines, hamburger + fullscreen overlay + focus trap + staggered link reveal + SVG social icons) is deleted in the same plan that wires BaseLayout to the new primitive. This takes the Phase 9 primitive library from 7 to 8 components.

**Hamburger visibility — container query, not viewport media query.** `Header.astro` sets `container-type: inline-size` on its inner flex container and uses a `@container (max-width: 380px)` rule to hide the inline `.site-nav` links and reveal the hamburger trigger. Threshold 380px is chosen because at a 375px viewport minus the 2 × 24px mobile `.container` padding, the header-inner element measures ≈ 327px wide — below 380px — so standard phones (320–414px viewport) see the hamburger while tablets and desktops keep the inline nav. Container queries have ~95% browser support in 2026 and react to the header's actual rendered width, not the viewport. The rationale for 380px specifically is that the mono wordmark `JACK CUTRARA` (Geist Mono 500, 0.875rem, 0.12em letter-spacing) plus three uppercase mono nav links (`works·about·contact` ≈ 22 characters separated by two 32px gaps) cramps visibly at that width.

**Overlay contents.** The rebuilt `MobileMenu.astro` renders:

1. A close button pinned top-right of the overlay (matching the v1.0 × icon pattern — planner's choice between SVG or mono `×` character)
2. Three mono nav links (`works`, `about`, `contact`) stacked vertically and centered, rendered at a prominent editorial size (planner selects between `.h2-project` 1.75rem and `.lead` clamp — whichever reads better). The active link receives the accent underline treatment from `.nav-link.is-active` defined inside `Header.astro` (text-decoration-color var(--accent), text-decoration-thickness 1.5px, text-underline-offset 6px).
3. A small `GITHUB · LINKEDIN · X · EMAIL` mono link row at the bottom of the overlay, using the same shape as the contact section's `.contact-links` (Geist Mono 500, 0.75rem, uppercase, 0.12em letter-spacing, `var(--ink-muted)` default, `var(--accent)` on hover). This row intentionally duplicates the mobile footer social row so contact links are always one tap away while the menu is open.

**A11y treatment.** Reuses the v1.0 shape plus the Phase 7 ChatWidget focus-trap pattern:

- `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Focus trap: Tab cycles within the overlay, Shift+Tab reverse-cycles, focus is **re-queried on every keypress** (matches Phase 7 `src/scripts/chat.ts` `setupFocusTrap` — see STATE.md "Focus trap re-queries focusable elements on every Tab keypress")
- Escape closes the overlay
- Click-outside on the backdrop closes the overlay
- Close button (top-right ×) closes the overlay
- `body { overflow: hidden }` while open
- Focus returns to the hamburger trigger on close
- Close on any nav-link click (so tapping a link dismisses the menu before the page navigates)

**Motion stance — no entrance animation.** The v1.0 `@keyframes menuLinkIn` 60ms-stepped staggered link reveal does **not** survive into the new `MobileMenu.astro`. The overlay opens instantly via display toggle only. Per §6.1, orchestrated entrance animations are dead. The only transition allowed inside the overlay is functional hover/focus color change on the link rows and the social row (consistent with §6.2 Tailwind `transition-colors` allowance). No translation, no opacity fade-in, no stagger delay.

**Props.** The new `MobileMenu.astro` takes no props; it reads `Astro.url.pathname` internally (matching Header per §5.1 / Phase 9 D-27) to compute the active link.
```

AFTER replacing §5.8, leave the rest of the file untouched — the next task in this plan handles §5.2. Do NOT touch any other section.
  </action>
  <verify>
    <automated>rtk grep -n "### 5.8 Mobile nav (Phase 9 rebuild decision)" design-system/MASTER.md</automated>
  </verify>
  <acceptance_criteria>
    - design-system/MASTER.md contains the exact heading `### 5.8 Mobile nav (Phase 9 rebuild decision)`
    - design-system/MASTER.md contains the literal string `container-type: inline-size`
    - design-system/MASTER.md contains the literal string `@container (max-width: 380px)`
    - design-system/MASTER.md contains the literal string `Focus trap: Tab cycles within the overlay`
    - design-system/MASTER.md contains the literal string `re-queried on every keypress`
    - design-system/MASTER.md contains the literal string `does **not** survive`
    - design-system/MASTER.md does NOT contain the old phrase `The MobileMenu.astro keep-or-delete decision is **Phase 9's call**`
    - design-system/MASTER.md does NOT contain the literal string `### 5.8 Phase 9 mobile-nav decision (deferred)`
  </acceptance_criteria>
  <done>§5.8 heading renamed and body replaced verbatim with the rebuild decision prose</done>
</task>

<task type="auto">
  <name>Task 2: Amend MASTER.md §5.2 (Footer mobile stack subsection)</name>
  <files>design-system/MASTER.md</files>
  <read_first>
    - design-system/MASTER.md lines 329–367 (§5.2 Footer — the section being extended; read the full current text so the amendment slots in without duplicating any existing language)
    - .planning/phases/09-primitives/09-CONTEXT.md D-10 (mobile footer 3-row stack decision) and D-17 (amendment mandate)
  </read_first>
  <action>
INSERT a new subsection at the END of §5.2 `Footer.astro` — AFTER the existing "HTML sketch" code block (which ends with `</footer>\n```\n`), BEFORE the `### 5.3 Container.astro` H3 that starts the next section.

Paste this text VERBATIM as the new subsection, keeping a single blank line between it and the preceding HTML sketch block and a single blank line before `### 5.3`:

```markdown
**Mobile stack — Phase 9 D-10 amendment.** At <768px viewport the footer becomes a 3-row vertical stack instead of the single-row default. This extends the "single-row default, optional flex-column stack" latitude already granted in the Mobile behavior paragraph above with a concrete Phase 9 decision: the mobile footer inserts a mono social link row between the copyright and the "BUILT WITH" caption.

Mobile stack (3 rows, centered horizontally, `gap: 12px` between rows, applied via a `@media (max-width: 767px)` rule inside `Footer.astro`'s scoped `<style>`):

1. `© 2026 JACK CUTRARA` — `.meta-mono` + `.tabular`, color `var(--ink-faint)`
2. `GITHUB · LINKEDIN · X · EMAIL` — `.label-mono` color `var(--ink-muted)`, each link hovers to `var(--accent)` (identical shape to the contact section's `.contact-links` and identical content to the MobileMenu overlay bottom row per §5.8)
3. `BUILT WITH ASTRO · TAILWIND · GEIST` — `.meta-mono` uppercase, color `var(--ink-faint)`

At ≥768px the default MASTER §5.2 single-row layout applies unchanged — the social row is hidden via `display: none` on desktop to avoid duplicating information that the Phase 10 contact section already presents.

The social row uses pure mono text (no SVG icons) consistent with §8 anti-icon stance. Rationale: mobile users who skip the contact section still have social links within reach in the footer; users who never open `MobileMenu.astro` still see them without scrolling.
```

Leave every other section of MASTER.md untouched.
  </action>
  <verify>
    <automated>rtk grep -n "Mobile stack — Phase 9 D-10 amendment" design-system/MASTER.md</automated>
  </verify>
  <acceptance_criteria>
    - design-system/MASTER.md contains the literal string `**Mobile stack — Phase 9 D-10 amendment.**`
    - design-system/MASTER.md contains the literal string `GITHUB · LINKEDIN · X · EMAIL`
    - design-system/MASTER.md contains the literal string `@media (max-width: 767px)` inside §5.2 context (grep anywhere in the file is sufficient)
    - design-system/MASTER.md contains the literal string `3 rows, centered horizontally`
    - The new amendment text appears AFTER the §5.2 HTML sketch and BEFORE the `### 5.3 \`Container.astro\`` heading — verify with: `rtk grep -n "Mobile stack — Phase 9 D-10 amendment\\|### 5.3" design-system/MASTER.md` and confirm the amendment line number is less than the 5.3 heading line number
    - design-system/MASTER.md still contains the original §5.2 heading `### 5.2 \`Footer.astro\``
    - design-system/MASTER.md still contains the §5.2 original HTML sketch with `class="site-footer"`
  </acceptance_criteria>
  <done>§5.2 now contains the Mobile stack amendment subsection positioned between the HTML sketch and §5.3</done>
</task>

</tasks>

<verification>
- Two sections amended in a single docs-only commit
- No code files touched
- Every grep-verifiable acceptance criterion passes
- Git diff shows only `design-system/MASTER.md` in the commit
</verification>

<success_criteria>
- `rtk grep -c "### 5.8 Mobile nav (Phase 9 rebuild decision)" design-system/MASTER.md` returns 1
- `rtk grep -c "Mobile stack — Phase 9 D-10 amendment" design-system/MASTER.md` returns 1
- `rtk grep -c "container-type: inline-size" design-system/MASTER.md` returns ≥1
- `rtk grep -c "### 5.8 Phase 9 mobile-nav decision (deferred)" design-system/MASTER.md` returns 0
- `rtk git diff --stat design-system/MASTER.md` shows only this file changed
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-01-SUMMARY.md` recording:
- The two sections amended (§5.8 heading renamed; §5.2 subsection appended)
- Confirmation that no code files were modified
- The commit SHA of the docs-only commit
- Any deviations from the amendment prose provided in the tasks (should be zero)
</output>
