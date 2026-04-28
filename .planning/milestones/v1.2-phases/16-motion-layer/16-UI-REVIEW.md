# Phase 16 — UI Review

**Audited:** 2026-04-27
**Baseline:** `.planning/phases/16-motion-layer/16-UI-SPEC.md` (v1.2 motion contract; six-pillar Checker sign-off all PASS)
**Screenshots:** captured at `.planning/ui-reviews/16-20260427-195040/` (desktop home, mobile home, about, project detail, contact, chat-open, reduced-motion)
**Dev server:** http://localhost:4321 (200 OK)
**Audit stance:** Phase 16 layers motion onto an already-locked v1.1 visual surface. UI-SPEC explicitly forbids new copy, color tokens, type roles, or spacing. The audit therefore weights the **Motion Contract** (UI-SPEC §"Motion Contract (PHASE-16 CORE)") more heavily than the inherited dimensions, and verifies inheritance was preserved byte-equivalent for the locked surface.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | No new copy introduced; chat error map and starters are calibrated and concrete |
| 2. Visuals | 4/4 | `.display` hero confirmed untouched live (success criterion #1); chat panel anchors bottom-right with correct scale-in transform-origin |
| 3. Color | 4/4 | Six-token palette intact; rgba ring confined to keyframe site only; print-only `#666`/`#ccc` properly scoped under `@media print` |
| 4. Typography | 4/4 | All seven type roles present in `global.css`; `.h1-section` word-stagger verified live (4 spans, `data-stagger-split="true"`); `.display` excluded |
| 5. Spacing | 4/4 | Motion amplitudes 4/8/12/16px all multiples of 4 and below 24px container floor; zero arbitrary Tailwind values |
| 6. Experience Design | 3/4 | Reduced-motion contract end-to-end correct; pulse pause coordination correct; one minor concern around typing-bounce reduce-override scope (see WARNING-EX-1) |

**Overall: 23 / 24**

---

## Top 3 Priority Fixes

The Phase 16 implementation is in unusually good shape — the contract is met end-to-end and verified by 338 GREEN tests + a 13-row manual UAT signoff. The three items below are all WARNING-tier (no BLOCKERs found):

1. **WARNING-EX-1 — Typing-bounce reduce-override is global, not scoped to chat** — User impact: low. Today's `.typing-dot` selector only appears inside the chat panel, so the global `@media (prefers-reduced-motion: reduce) { .typing-dot { animation: none; } }` block at `src/styles/global.css:679-683` is functionally correct. However, if a future plan reuses `.typing-dot` outside chat (e.g., a streaming summary on a project page), the reduce-override would silently apply globally. Concrete fix: tighten the selector to `#chat-typing .typing-dot` to match scope. Optional drift-guard.
2. **WARNING-CO-1 — Chat error copy is correct but one entry duplicates** — `chat.ts:371` (`api_error`) and `chat.ts:374` (`timeout`) both render the identical string `"Sorry, I'm having trouble right now. Try again in a moment."` — verbatim duplicate. User impact: minor. Distinct error categories should produce distinct messaging so the user can differentiate "something broke our end" from "your network was slow" — even subtle ("Sorry, that took longer than expected. Try again." for timeout) helps user mental models. Concrete fix: differentiate the timeout copy. Out of scope for Phase 16 motion contract; flagging for the next chat-touching phase.
3. **WARNING-EX-2 — `.display` hero word-stagger guard is selector-based, not attribute-based** — `motion.ts:83` checks `target.matches(".h1-section") && !target.matches(".display")`. The `.display` exclusion is correct today (hero is `<h1 class="display">`, never `.h1-section`), but the negative-match is defensive against a contributor adding both classes — a fragile guarantee. Concrete fix: switch to a positive opt-out attribute (`data-no-stagger`) on the hero element so adding `.h1-section` to the hero in the future does not silently re-enable stagger. UI-SPEC D-13 (data-stagger-split) sets the precedent for attribute-based markers. Optional hardening.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

UI-SPEC declares Phase 16 introduces no new visible UI strings. Audit confirms.

- Generic-label search across `src/**/*.astro`: zero matches for `Submit`, `Click Here`, `OK`, `Cancel`, `Save` — confirming the editorial system's "no buttons, only labels" stance from MASTER §5.5.
- `Ask about Jack`, `AVAILABLE FOR WORK`, `JACK CUTRARA`, `LIVE DEMO →` — all UI-SPEC inherited copy verbatim present (`Header.astro`, `StatusDot.astro`, `index.astro`, `Footer.astro`).
- Error map at `chat.ts:370-375` is concrete and helpful (`"You've sent a lot of messages. Please wait a moment before trying again."` etc.) — none of the auditor's anti-pattern strings ("went wrong", "error occurred", "try again" alone). The lone duplicated string is the api_error/timeout pair (WARNING-CO-1 above).
- Voice rule honored: site uses first-person (`"I build small, production-grade services..."` `about.astro`); chat uses third-person via the `Ask about Jack` label.
- Empty/loading/destructive copy: not applicable — Phase 16 introduced no new states.

### Pillar 2: Visuals (4/4)

- **Live verification of `.display` hero (success criterion #1):** Playwright `evaluate(...)` confirms `.display` has neither `data-stagger-split` nor `reveal-on` and renders as raw text `JACK<br>CUTRARA.<span class="accent-dot">` — UNTOUCHED end-to-end. Screenshot `desktop-home.png` matches.
- **Live verification of `.h1-section` word-stagger:** Both `§ 01 — WORK` and `§ 02 — ABOUT` headings carry `data-stagger-split="true"` with 4 child SPAN elements each — MOTN-07 + D-13 idempotency working correctly.
- **Visual hierarchy:** clear focal point on every page (hero `JACK CUTRARA.` on home; `SeatWatch` H2 on project detail; bold question on About; large mailto on Contact).
- **Chat bubble:** 48×48 round, single accent surface (per MASTER §10 exception), aria-label `Open chat` + aria-expanded toggling — motion `desktop-chat-open.png` confirms scale-in transform-origin: bottom right (panel grows from bubble corner).
- **Mobile screenshot:** hero stacks correctly, hamburger replaces nav, status dot renders below subtitle. No layout breakage at 375px.

### Pillar 3: Color (4/4)

- Six tokens declared in `:root` (`global.css:9-14`): `#FAFAF7`, `#0A0A0A`, `#52525B`, `#A1A1AA`, `#E4E4E7`, `#E63946`. Verbatim match to UI-SPEC.
- Hardcoded color audit: 4 occurrences total. All within `@media print` (lines 200, 220, 242: `#666` and `#ccc` for grayscale print rules) — acceptable; print stylesheet does not affect screen rendering.
- One additional `#E63946` in a comment at line 637 — informational, not executable.
- `var(--accent)` usage spans 13 files / 37 occurrences — all aligned with the UI-SPEC accent reservation list (StatusDot, Header active link, WorkRow arrow, Footer email, ChatWidget bubble + focus ring, accent-dot on hero, focus-visible outlines). No accent leakage onto decorative borders.
- Pulse rgba conversion: confined to three lines (`global.css:640, 644, 648`) at the keyframe declaration site — `--accent` itself remains a pure hex token. Matches UI-SPEC color contract verbatim.
- Print-only `#666`/`#ccc` could in principle be replaced with `var(--ink-muted)` / `var(--rule)` for token consistency — but this is a non-issue (print scope, not screen).

### Pillar 4: Typography (4/4)

All seven type role classes present and accounted for in `global.css`:

| Role | Line | UI-SPEC compliance |
|------|------|--------------------|
| `.display` | 425 | declared, used on hero only |
| `.h1-section` | 434 | used on SectionHeader instances + project page titles |
| `.h2-project` | 442 | used inside WorkRow + project hero |
| `.lead` | 450 | used on subtitle paragraphs |
| `.body` | 457 | used in About + project prose |
| `.label-mono` | 465 | used on header nav, meta strips |
| `.meta-mono` | 473 | used on number columns, year labels |

Motion-on-typography contract from UI-SPEC §Typography table:
- `.display` NEVER stagger / NEVER reveal — verified live (no `data-stagger-split`, no `reveal-on`).
- `.h1-section` YES stagger / YES reveal — verified live (`data-stagger-split="true"`, 4 child spans).
- `.h2-project`, `.lead`, `.body` reveal as part of parent block — `.work-row` and `.prose-editorial p` and `.about-body p` all in `REVEAL_SELECTOR` (`motion.ts:18-19`).
- `.label-mono` / `.meta-mono` NO own animation, inherit from parent — confirmed (selector list does not include them).

Idempotency guard `if (el.children.length > 0) return;` at `motion.ts:49` (WR-04 review note) protects against destructively flattening authored inline markup like `<em>`/`<strong>` inside an `.h1-section`. Defensive correctness.

### Pillar 5: Spacing (4/4)

- Motion amplitudes (UI-SPEC §Spacing): translateY 12px (reveal), translateY 8px (word), translateX 4px (arrow), 16px (pulse box-shadow expansion). All multiples of 4. All below the 24px container floor — no risk of clipping at viewport edges.
- Tailwind utility audit (`p-`/`px-`/`py-`/`m-`/`mt-`/`gap-`): only 5 unique classes found across all `.astro` files (`p-4`, `py-2`, `px-4`, `my-8`, `mt-2`) — extremely restrained, all on the 4px scale. Per project convention, primitives use scoped `<style>` blocks instead, so this low count is the expected baseline.
- Arbitrary Tailwind values (e.g., `[24px]`, `[1.5rem]`): zero matches in `.astro` files. Clean.
- Container/section margin tokens preserved from MASTER §2.2 (24/32/48 horizontal, 72/96/160 vertical) — no edits in Phase 16 scope.

### Pillar 6: Experience Design (3/4)

**Strong points:**
- **Reduced-motion contract end-to-end:** `motion.ts:100` early-returns on `shouldReduceMotion()`; `desktop-home-reduced.png` confirms hero renders identically (no flicker, no missing words, no stuck opacity-0 spans). View-transition + reveal + word-stagger all gated inside `@media (prefers-reduced-motion: no-preference)` (`global.css:566-607`). Pulse + typing-dot use the paired-reduce-override pattern (`global.css:670-683`). ROADMAP "first test must be reduced-motion" gate visibly held.
- **Pulse pause coordination (D-15):** `chat.ts:540` (openPanel) calls `stopPulse($bubble)` BEFORE the focus-trap setup at line 599 — order locked by `chat-pulse-coordination.test.ts` spy assertions (8/8 GREEN). `chat.ts:625` (closePanel) calls `startPulse($bubble)` inside `.then()` AFTER `bubble.focus()` at line 622. Correctness verified by tests AND by call-order ordering review.
- **`.is-open` class (MOTN-05):** `chat.ts:541` adds, `chat.ts:615` removes — additive over the Phase 7 `panel.style.display = 'flex'/'none'` invariant (preserved byte-identical per D-26 gate). Scale-in animation only fires when `.is-open` is present (`global.css:699`).
- **Property whitelist enforced:** zero `cubic-bezier(`, zero `will-change`, zero `filter:`, zero `backdrop-filter:`, zero `font-size` animations across `src/**`. MOTN-10 stress guards held.
- **Idempotency:** `data-stagger-split` (D-13) prevents re-wrap on Astro page-load; `motionInitialized` prevents double-observer; `motionBootstrapped` prevents re-bootstrap during HMR.
- **404 page exists** (`src/pages/404.astro`) — empty-state coverage for routing.
- **Aria coverage:** 58 `aria-*` attributes across 15 files; chat dialog has `role="dialog"` + `aria-modal="true"` + `aria-label="Chat with Jack's AI"`; bubble has `aria-expanded` toggling.

**WARNINGs justifying score deduction (3 → not 4):**

- **WARNING-EX-1:** `.typing-dot` reduce-override at `global.css:679-683` uses unscoped `.typing-dot` selector. Currently safe (only one use site inside chat), but a future reuse outside chat would silently inherit the reduce-override even if the new use site wanted its own animation. Tighten to `#chat-typing .typing-dot` for scope discipline. Top-3 fix #1.
- **WARNING-EX-2:** `.display` exclusion in `motion.ts:83` is selector-negation rather than attribute-opt-out — fragile if a contributor ever adds `.h1-section` to the hero. Precedent for attribute markers exists (D-13's `data-stagger-split`). Top-3 fix #3.

These are hardening recommendations, not defects — Phase 16 ships within its contract.

---

## Motion Contract Compliance Matrix

| ID | Spec | Implementation | Status |
|----|------|----------------|--------|
| MOTN-01 | View-transition fade 200ms ease-out | `global.css:569,572` — `view-transition-fade-out 200ms ease-out forwards` + `view-transition-fade-in 200ms ease-out forwards` inside no-preference | PASS |
| MOTN-02 | Scroll-reveal opacity 0→1 + translateY 12→0, 300ms ease-out, one-shot | `global.css:554-557, 590` + `motion.ts:86` (observer.unobserve) | PASS |
| MOTN-03 | WorkRow arrow opacity 0→1 + translateX 0→4px, 180ms ease-out | `WorkRow.astro:87, 100-101` — exact match including ease-out on transform | PASS |
| MOTN-04 | Chat bubble pulse box-shadow 0→16px rgba 0.4→0 + scale 1→1.02→1, 2500ms ease-in-out infinite | `global.css:638-656` — keyframe stops 0%/50%/100% match D-14 exactly | PASS |
| MOTN-05 | Chat panel scale 0.96→1.0 + opacity 0→1, 180ms ease-out, transform-origin bottom right | `global.css:691-713` — verified via `desktop-chat-open.png` (panel grows from bubble corner) | PASS |
| MOTN-06 | Typing-dot bounce 600ms ease-in-out infinite (already live) + reduce-override added | `global.css:260-280` byte-identical + `679-683` paired override | PASS (with WARNING-EX-1 about scope) |
| MOTN-07 | `.h1-section` word-stagger 250ms ease-out per word, 60ms delay between, `.display` excluded | `motion.ts:45-65` (textContent-only span-wrap) + `global.css:598-606` + verified live (4-span output, `.display` untouched) | PASS |
| MOTN-08 | All entrances inside `@media no-preference`; loops paired with `reduce` override; reduce path = resting state immediately | All entrance rules verified gated; pulse + typing-dot paired with reduce; `motion.ts:100` early-return prevents DOM mutation under reduce | PASS |
| MOTN-10 | Lighthouse Performance ≥99, A11y ≥95, BP=100, SEO=100, TBT ≤150ms, CLS ≤0.01 | Per `16-VERIFICATION.md`: localhost Performance 80/81 ACCEPTED per Phase 15 §9 (production gate); A11y 95 / BP 100 / SEO 100 / TBT 0ms / CLS≈0 PASS verbatim on both URLs | PASS (with localhost caveat) |

---

## Files Audited

**Source:**
- `src/styles/global.css` (713 lines — all motion-relevant blocks at lines 74-81, 126-133, 260-280, 425-487, 526-713)
- `src/scripts/motion.ts` (158 lines)
- `src/scripts/lib/observer.ts` (47 lines)
- `src/scripts/chat.ts` (lines 365-375 error map + 451-475 pulse stubs + 532-628 open/close panel ordering)
- `src/components/primitives/WorkRow.astro` (full file — markup + scoped style)
- `src/components/chat/ChatWidget.astro` (lines 1-60 — bubble + panel markup, aria attrs)

**Design contract:**
- `.planning/phases/16-motion-layer/16-UI-SPEC.md`
- `.planning/phases/16-motion-layer/16-CONTEXT.md`
- All 7 plan SUMMARY files (16-01 through 16-07)

**Live verification:**
- 7 screenshots at `.planning/ui-reviews/16-20260427-195040/` covering home (desktop + mobile), about, project detail, contact, chat-open, reduced-motion
- Live `page.evaluate()` against `localhost:4321` confirming `.display` untouched + `.h1-section` properly stagger-wrapped

**Test evidence (informational, not re-run):**
- `16-VERIFICATION.md` records 338/338 GREEN, 117/117 D-26 chat regression, 13/13 manual UAT PASS, lighthouse-{home,project}.json artifacts committed.

---

*Phase 16 ships within all locked budgets. The motion layer is live, restrained, reduced-motion-correct, and demonstrably leaves the hero untouched. The three WARNINGs above are hardening recommendations — none block close-out.*
