---
phase: 09-primitives
plan: 08
type: execute
wave: 7
depends_on: [09-05, 09-06, 09-07]
files_modified:
  - .planning/phases/09-primitives/VERIFICATION.md
autonomous: false

requirements: []

must_haves:
  truths:
    - "pnpm run build exits 0 with zero errors after all Phase 9 plans land"
    - "pnpm run lint exits 0 (ESLint clean)"
    - "pnpm run check exits 0 (astro check green)"
    - "pnpm run test exits 0 (vitest green — all existing tests still pass)"
    - "Manual chat smoke test passes — dev server launches, chat bubble opens on a stub page, SSE streaming works, Geist Mono renders in code blocks, focus trap works on Tab, bubble closes cleanly"
    - "/dev/primitives loads in dev server and every primitive renders correctly against mockup.html at desktop (1440px) and mobile (375px) widths"
    - "Phase 9 verification gate record written to .planning/phases/09-primitives/VERIFICATION.md"
  artifacts:
    - path: .planning/phases/09-primitives/VERIFICATION.md
      provides: Phase 9 verification gate pass record
      contains: "SC#7"
  key_links:
    - from: .planning/phases/09-primitives/VERIFICATION.md
      to: .planning/ROADMAP.md Phase 9 success criteria SC#1–SC#7
      via: Each SC is checked off with observed evidence
      pattern: "SC#[1-7]"
---

<objective>
Run the 5-point Phase 9 verification gate per D-29 (4 automated + 1 manual) plus the D-30 visual check of `/dev/primitives`, then record the results in `.planning/phases/09-primitives/VERIFICATION.md`. This is the final wave of Phase 9.

**Purpose:** Phase 9 ships only when all five gate items pass AND the /dev/primitives visual spot-check lines up with mockup.html. This plan turns those checks into observable records.

**Output:** A `VERIFICATION.md` document in the phase directory with pass/fail marks, captured command outputs (or short excerpts), manual smoke test observations, and any follow-ups for Phase 10.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@.planning/ROADMAP.md
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run the 4 automated gate commands and capture results</name>
  <files>.planning/phases/09-primitives/VERIFICATION.md</files>
  <read_first>
    - package.json lines 9–20 (confirms the four script names: build, lint, check, test)
    - .planning/phases/09-primitives/09-CONTEXT.md D-29 (the 5-point gate)
    - .planning/ROADMAP.md Phase 9 Success Criteria (SC#1–SC#7 — each will be evaluated in VERIFICATION.md)
  </read_first>
  <action>
Run these four commands **in order**, capture exit codes and any output (use `rtk` to compress long output):

```bash
rtk pnpm run build
rtk pnpm run lint
rtk pnpm run check
rtk pnpm run test
```

Expected outcomes:
- `pnpm run build` — exit 0. Runs `wrangler types && astro check && astro build && node scripts/pages-compat.mjs`. Must compile every primitive, the preview page, the updated BaseLayout, the restyled NextProject, and generate a sitemap that does NOT include `/dev/primitives`.
- `pnpm run lint` — exit 0. ESLint on all .astro/.ts/.mjs files. Remember the Phase 8 `argsIgnorePattern: ^_` rule for unused stub params.
- `pnpm run check` — exit 0. `astro check` — all Astro types resolve, no unused imports, no missing props.
- `pnpm run test` — exit 0. Vitest. Existing Phase 7/8 tests must still pass.

For each command, record in VERIFICATION.md: command, exit code, pass/fail, and a 1–2 line summary of notable output (e.g., "Built 4 pages in 1.3s", "No lint errors", "12 tests passed").

If ANY command fails with a non-zero exit code, STOP. Do NOT proceed to the manual chat smoke test (task 2). Instead, write the failure to VERIFICATION.md as `BLOCKED` with the error output verbatim, and escalate by returning the failure to the orchestrator. Gap-closure planning can then create a fix plan before verification re-runs.
  </action>
  <verify>
    <automated>rtk pnpm run build && rtk pnpm run lint && rtk pnpm run check && rtk pnpm run test</automated>
  </verify>
  <acceptance_criteria>
    - `rtk pnpm run build` exits 0
    - `rtk pnpm run lint` exits 0
    - `rtk pnpm run check` exits 0
    - `rtk pnpm run test` exits 0
    - .planning/phases/09-primitives/VERIFICATION.md exists
    - VERIFICATION.md contains a section header like `## Automated Gate` with 4 rows
    - VERIFICATION.md contains the string `pnpm run build` with a pass result
    - VERIFICATION.md contains the string `pnpm run lint` with a pass result
    - VERIFICATION.md contains the string `pnpm run check` with a pass result
    - VERIFICATION.md contains the string `pnpm run test` with a pass result
  </acceptance_criteria>
  <done>Four automated gate commands pass and results recorded in VERIFICATION.md</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual chat smoke test + /dev/primitives visual check</name>
  <files>.planning/phases/09-primitives/VERIFICATION.md</files>
  <action>Pause execution and walk the user through the two manual verification procedures documented in the `<how-to-verify>` block below: (a) the Phase 7 chat widget smoke test on a stub page and (b) the /dev/primitives visual check at 1440px and 375px widths. After the user confirms PASS/FAIL for each step, append a `## Manual Gate` section to `.planning/phases/09-primitives/VERIFICATION.md` capturing the results, then wait for the resume signal before proceeding to Task 3.</action>
  <verify>
    <manual>User types `approved` after stepping through all checklist items in the `<how-to-verify>` block below, or describes any failure observed.</manual>
  </verify>
  <done>User has confirmed the chat smoke test passed, the /dev/primitives visual check passed at both 1440px and 375px, and the `## Manual Gate` section is written to VERIFICATION.md.</done>
  <what-built>
Phase 9 rebuilt the editorial chrome (Header, Footer, MobileMenu) and swapped BaseLayout to consume them. The ChatWidget was explicitly hands-off (D-26). The /dev/primitives preview route now exists as the canonical primitive catalog. This manual verification confirms:

1. The chat widget still works (Phase 7 regression gate, same shape as Phase 8 D-26)
2. The /dev/primitives page renders correctly at desktop (1440px) and mobile (375px) widths against mockup.html as the visual reference (D-30)

The user must perform these checks manually because:
- The chat smoke test requires an Anthropic API call and SSE streaming observation — no headless test automates this
- The /dev/primitives visual check compares pixels to mockup.html — human eyes only
  </what-built>
  <how-to-verify>
**Setup:** Start the dev server:
```bash
rtk pnpm run dev
```

Wait for the `Local: http://localhost:4321/` line, then open that URL in a browser.

**Part A — Chat smoke test (D-29 item 5):**

1. Visit `http://localhost:4321/` (the homepage stub — it still renders its Phase 8 placeholder content since page port is Phase 10)
2. Look for the chat bubble in the bottom-right corner (it's rendered by BaseLayout.astro from ChatWidget.astro)
3. Click the bubble to open the chat panel
4. Type a simple question like "What projects has Jack built?" and press Enter
5. Verify:
   - [ ] The chat panel opens
   - [ ] Your message appears in the user bubble
   - [ ] A bot response starts streaming in (SSE works)
   - [ ] If the response includes any code or inline code, it renders in Geist Mono (not Geist regular)
   - [ ] Pressing Tab cycles focus between the input, send button, and any rendered bot-message links (focus trap re-query — from src/scripts/chat.ts)
   - [ ] Pressing Escape or clicking the × button closes the chat panel cleanly
   - [ ] The chat bubble re-appears after close
   - [ ] Browser dev tools console has NO new errors related to chat, Header, Footer, MobileMenu, or any primitive

**Part B — /dev/primitives visual check (D-30):**

6. Navigate to `http://localhost:4321/dev/primitives` in the same browser
7. Verify at desktop width (~1440px — maximize or resize):
   - [ ] The sticky editorial header is at the top with `JACK CUTRARA` wordmark and `works / about / contact` inline nav
   - [ ] No nav link is active (the preview route `/dev/primitives` doesn't match any nav href)
   - [ ] No hamburger is visible at desktop width
   - [ ] The 8 sections render in order: § 01 HEADER → § 02 FOOTER → § 03 CONTAINER → § 04 METALABEL → § 05 STATUSDOT → § 06 SECTIONHEADER → § 07 WORKROW → § 08 MOBILEMENU
   - [ ] § 04 METALABEL shows 3 variants (default ink, ink-muted, ink-faint) with visibly different contrast
   - [ ] § 05 STATUSDOT shows a 6px red accent dot followed by `AVAILABLE FOR WORK` uppercase mono label
   - [ ] § 06 SECTIONHEADER shows two examples: one with a count, one without
   - [ ] § 07 WORKROW shows 4 real projects from the content collection with the accent arrow hidden by default. Hovering any row reveals the accent `→` arrow and underlines the title
   - [ ] The sticky editorial footer is at the bottom with copyright on the left and `BUILT WITH ASTRO · TAILWIND · GEIST` on the right. No social row at desktop width.
   - [ ] Every text rendered is Geist sans or Geist Mono — no other fonts visible
   - [ ] Every color visible is one of #FAFAF7 bg, #0A0A0A ink, #52525B muted, #A1A1AA faint, #E4E4E7 rule, #E63946 accent — no rainbow, no theme colors, no stray hex

8. Resize the browser to 375px width (Chrome dev tools Device Toolbar → iPhone SE or manual resize):
   - [ ] The inline nav disappears and a hamburger trigger appears in the header (container-query swap at 380px header-inner width)
   - [ ] The footer switches to a 3-row vertical stack: copyright on top, `GITHUB · LINKEDIN · X · EMAIL` mono link row in the middle, `BUILT WITH ASTRO · TAILWIND · GEIST` on the bottom
   - [ ] Clicking the hamburger opens the MobileMenu dialog
   - [ ] The dialog shows 3 stacked nav links (`works`, `about`, `contact`) at a prominent size, the × close button top-right, and the `GITHUB · LINKEDIN · X · EMAIL` mono row at the bottom
   - [ ] Pressing Tab inside the dialog cycles through focusable elements only (close button, 3 nav links, 4 social links — 8 total) and does NOT escape to the page behind
   - [ ] Shift+Tab reverses the cycle
   - [ ] Pressing Escape closes the dialog and returns focus to the hamburger trigger
   - [ ] Clicking the background (outside the panel content area) closes the dialog
   - [ ] Clicking the × button closes the dialog
   - [ ] There is NO staggered entrance animation when the dialog opens — links appear instantly

**Part C — Record findings in VERIFICATION.md:**

Append a `## Manual Gate` section to `.planning/phases/09-primitives/VERIFICATION.md` with:
- Chat smoke test: PASS / FAIL with any notable observations
- /dev/primitives desktop check: PASS / FAIL with any visual deviations from mockup.html
- /dev/primitives mobile check: PASS / FAIL with any container-query/MobileMenu/focus-trap findings
- Any issues that should become Phase 10 or Phase 11 follow-ups

If anything fails, describe the failure precisely and stop — the phase does not ship until the failure is fixed.
  </how-to-verify>
  <resume-signal>
Type `approved` if all checks pass, or describe any failures observed. If describing failures, include:
- Which step number failed
- What you expected to see
- What you actually saw
- Any console errors (copy/paste the error text)
  </resume-signal>
</task>

<task type="auto">
  <name>Task 3: Finalize VERIFICATION.md with SC#1–SC#7 evaluation</name>
  <files>.planning/phases/09-primitives/VERIFICATION.md</files>
  <read_first>
    - .planning/ROADMAP.md Phase 9 Success Criteria section (SC#1 through SC#7)
    - .planning/phases/09-primitives/VERIFICATION.md (current state after tasks 1 and 2)
  </read_first>
  <action>
APPEND a `## Success Criteria Evaluation` section to `.planning/phases/09-primitives/VERIFICATION.md` that evaluates each of the 7 Phase 9 success criteria from ROADMAP.md against the observations from tasks 1 and 2. Use this format:

```markdown
## Success Criteria Evaluation

| SC | Criterion (paraphrased) | Result | Evidence |
|----|-------------------------|--------|----------|
| SC#1 | Rebuilt Header.astro with sticky 72px + wordmark + 3-link nav + active underline | PASS | /dev/primitives desktop check observed inline nav; active state verified via direct route |
| SC#2 | Rebuilt Footer.astro 64px copyright + BUILT WITH caption | PASS | /dev/primitives desktop check — single row at ≥768px |
| SC#3 | New primitives render correctly in isolation (Container, SectionHeader, WorkRow, MetaLabel, StatusDot) | PASS | /dev/primitives page renders all 5 stateless primitives via sample data |
| SC#4 | MobileMenu question resolved — rebuilt as editorial primitive per D-05/D-06/D-07/D-08/D-09 + MASTER §5.8 amendment in plan 01 | PASS | MASTER §5.8 amendment landed in plan 09-01; MobileMenu.astro created in plan 09-04; verified open/close/focus-trap on mobile viewport |
| SC#5 | Primitives use only Phase 8 hex tokens + Geist/Geist Mono + mockup rule weights | PASS | Negative grep regression in plan 04 confirmed no inline hex, no oklch, no GSAP, no Tailwind utilities in primitive markup |
| SC#6 | Kept components audited and updated if applicable (NextProject restyled, JsonLd/SkipToContent/ArticleImage verify-only) | PASS | Plan 09-06 restyled NextProject to editorial row; 3 verify-only audits all PASS |
| SC#7 | pnpm run build succeeds and chat widget still functions | PASS | Plan 08 task 1 automated gate all 4 commands exit 0; manual chat smoke test confirmed working |
```

Replace each `PASS` / `FAIL` with the actual observed result from the previous tasks. If any SC is FAIL, describe what's missing in the Evidence column and mark the phase as BLOCKED.

Also append a `## Phase 9 Sign-Off` section:

```markdown
## Phase 9 Sign-Off

- All 5 D-29 gate items pass: {yes/no}
- D-30 /dev/primitives visual check at 1440px and 375px: {pass/fail}
- SC#1–SC#7 all PASS: {yes/no}
- Follow-ups for Phase 10: {list any, or "None"}
- Follow-ups for Phase 11: {list any, or "None"}
- Phase 9 ready to ship: {yes/no}
```

Commit the final VERIFICATION.md as part of this plan's completion.
  </action>
  <verify>
    <automated>rtk grep -c "PASS\\|FAIL" .planning/phases/09-primitives/VERIFICATION.md</automated>
  </verify>
  <acceptance_criteria>
    - .planning/phases/09-primitives/VERIFICATION.md contains a `## Success Criteria Evaluation` section
    - VERIFICATION.md contains one row for each of SC#1, SC#2, SC#3, SC#4, SC#5, SC#6, SC#7 (seven rows total in the SC table)
    - VERIFICATION.md contains a `## Phase 9 Sign-Off` section
    - VERIFICATION.md contains the literal string `Phase 9 ready to ship:`
    - If any SC row reads FAIL, VERIFICATION.md must include a description of the failure and a `BLOCKED` label
    - If all 7 SC rows read PASS, VERIFICATION.md contains `Phase 9 ready to ship: yes`
    - `rtk git status` shows VERIFICATION.md staged or committed
  </acceptance_criteria>
  <done>VERIFICATION.md finalized with gate results, SC evaluation, and sign-off</done>
</task>

</tasks>

<verification>
- All 4 automated gate commands pass (build, lint, check, test)
- Manual chat smoke test passes
- /dev/primitives visual check passes at 1440px and 375px
- MobileMenu dialog behavior verified (open, focus trap, Escape, backdrop close, focus return, no stagger animation)
- VERIFICATION.md written with Automated Gate + Manual Gate + Success Criteria Evaluation + Sign-Off sections
- All 7 SC rows read PASS
</verification>

<success_criteria>
- D-29 5-point gate fully satisfied (4 automated + 1 manual)
- D-30 /dev/primitives visual check recorded
- SC#1–SC#7 all evaluated and recorded
- Phase 9 either ships (all PASS) or is BLOCKED with specific failures documented
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-08-SUMMARY.md` recording:
- The 4 automated gate command results
- The manual smoke test + visual check outcome
- SC#1–SC#7 PASS/FAIL summary
- Any Phase 10 / Phase 11 follow-ups surfaced during verification
- Commit SHA
</output>
