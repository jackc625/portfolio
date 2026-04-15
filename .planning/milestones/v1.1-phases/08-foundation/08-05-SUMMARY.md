---
phase: 08-foundation
plan: 05
subsystem: foundation
tags: [chat-widget, token-rename, editorial-redesign, v1.1]
requires: [08-03]
provides:
  - "ChatWidget.astro inline styles bound to new editorial tokens (--bg/--rule/--ink/--ink-muted/--ink-faint/--accent)"
  - "global.css .chat-* rule block bound to new editorial tokens with --font-mono replacing --font-code"
  - "portfolio-context.json siteStack with no GSAP reference"
  - "Zero --token-* references remaining anywhere in src/components/chat/, src/styles/global.css, or src/data/portfolio-context.json"
affects:
  - src/components/chat/ChatWidget.astro
  - src/styles/global.css
  - src/data/portfolio-context.json
tech_stack:
  added: []
  removed: []
  patterns:
    - "Mechanical token rename only — no visual restyle (CHAT-02 deferred to Phase 10)"
    - "Flat literal values (8px, 16px, 0.875rem, 1rem) replace --token-space-* and --token-text-* per D-08"
key_files:
  created: []
  modified:
    - src/components/chat/ChatWidget.astro
    - src/styles/global.css
    - src/data/portfolio-context.json
  deleted: []
decisions:
  - "[Plan 08-05]: portfolio-context.json audit found only one v1.0 design reference (\"GSAP\" in siteStack) — none of the speculative audit targets (canvas hero, dark theme, theme toggle, IBM Plex Mono, oklch, shiyunlu, scroll animations) actually exist in the file, so no rewrites were needed beyond the GSAP removal"
  - "[Plan 08-05]: Updated stale @theme bridge doc comment in global.css that referenced \"--token-* references\" — small housekeeping fix to keep the satisfying grep result of 0 token- matches across the entire file"
metrics:
  duration_min: 4
  tasks_completed: 2
  files_modified: 3
  files_deleted: 0
  commits: 2
completed: 2026-04-08
requirements_addressed: [DSGN-02, DSGN-04]
---

# Phase 8 Plan 5: Chat Widget Token Cascade Summary

One-liner: Mechanical rename of all `--token-*` and `--font-code` references inside ChatWidget.astro inline styles, global.css `.chat-*` rule block, and portfolio-context.json's siteStack — completing the editorial token cascade for the chat surface without restyling it (CHAT-02 redesign deferred to Phase 10 per D-19).

## What Changed

### Task 1 — ChatWidget.astro + global.css `.chat-*` token rename (commit `4895561`)

**`src/components/chat/ChatWidget.astro`** — full rewrite of every `style="..."` inline attribute that referenced `--token-*`:

| Line | Element | Before | After |
|------|---------|--------|-------|
| 14 | `#chat-bubble` | `background: var(--token-accent)` | `background: var(--accent)` |
| 56 | `#chat-panel` | `var(--token-bg-primary)` + `var(--token-border)` | `var(--bg)` + `var(--rule)` |
| 63 | header div | `var(--token-bg-secondary)` + `var(--token-border)` + `var(--token-space-md)` | `var(--rule)` + `var(--rule)` + `16px` |
| 67 | header span | `var(--token-text-sm)` + `var(--token-text-primary)` | `0.875rem` + `var(--ink)` |
| 87 | close icon | `var(--token-text-muted)` | `var(--ink-faint)` |
| 99 | `#chat-messages` | `padding: var(--token-space-md)` | `padding: 16px` |
| 108 | `#chat-starters` | `gap: var(--token-space-sm)` | `gap: 8px` |
| 115/124/133/142 | 4 starter chips | `var(--token-bg-secondary)` + `var(--token-border)` + `var(--token-text-sm)` + `var(--token-text-secondary)` | `var(--rule)` + `var(--rule)` + `0.875rem` + `var(--ink-muted)` |
| 152 | `#chat-typing` | `border-left: 2px solid var(--token-border)` | `border-left: 2px solid var(--rule)` |
| 163 | input area wrapper | `var(--token-border)` + `var(--token-space-md)` + `var(--token-bg-primary)` | `var(--rule)` + `16px` + `var(--bg)` |
| 165 | input flex row | `gap: var(--token-space-sm)` | `gap: 8px` |
| 173 | `#chat-input` textarea | `var(--token-bg-secondary)` + `var(--token-border)` + `var(--token-text-base)` + `var(--token-text-primary)` | `var(--rule)` + `var(--rule)` + `1rem` + `var(--ink)` |
| 177 | `#chat-char-count` | `var(--token-text-sm)` + `var(--token-text-muted)` | `0.875rem` + `var(--ink-faint)` |
| 184 | `#chat-send` | `background: var(--token-accent)` | `background: var(--accent)` |
| 208 | privacy note | `var(--token-text-sm)` + `var(--token-text-muted)` | `0.875rem` + `var(--ink-faint)` |

Total: 18 inline-style sites updated. Functionality, structure, IDs, classes, ARIA attributes, and SVGs all unchanged. The textarea still references `var(--font-body)` because Plan 03 already populated that token via the @theme bridge.

**`src/styles/global.css`** — `.chat-*` rule block (formerly lines 354-451) updates:

1. `.typing-dot` background-color: `var(--token-text-muted)` → `var(--ink-faint)`
2. `.chat-textarea:focus` border-color: `var(--token-border-hover)` → `var(--ink-muted)`; box-shadow accent: `var(--token-accent)` → `var(--accent)`
3. `.chat-bot-message ul/ol` padding-left: `var(--token-space-md)` → `16px`
4. `.chat-bot-message li` margin-bottom: `var(--token-space-xs)` → `4px`
5. `.chat-bot-message code` font-family: `var(--font-code)` → `var(--font-mono)`; font-size: `var(--token-text-sm)` → `0.875rem`; background: `var(--token-bg-secondary)` → `var(--rule)`
6. `.chat-bot-message a` color: `var(--token-accent)` → `var(--accent)`
7. `.chat-starter-chip:hover` border-color: `var(--token-border-hover)` → `var(--ink-muted)`; color: `var(--token-accent)` → `var(--accent)`
8. `.hover-text-primary:hover` color: `var(--token-text-primary)` → `var(--ink)`
9. `.copy-success svg` color: `var(--token-success)` → `var(--accent)`

Total: 10 rule sites updated. `.chat-textarea` base rule (resize/min-height/max-height/overflow-y), `.chat-copy-btn` opacity transition, `.chat-message-wrapper:hover .chat-copy-btn`, and the `@media (max-width: 767px) { .chat-panel-mobile { ... } }` mobile fullscreen rule are all preserved unchanged.

**Housekeeping:** Updated a stale doc comment in the LAYER 2 `@theme` bridge section (line 26) that referenced `var(--token-*)` — rewrote to "All color values reference the editorial :root tokens so palette changes propagate automatically (RESEARCH.md Pitfall 4)." This was needed to satisfy the acceptance criterion `grep -c 'token-' src/styles/global.css` = 0.

### Task 2 — portfolio-context.json audit (commit `6efb9b1`)

**`src/data/portfolio-context.json`:**
- `siteStack` array: removed `"GSAP"` → `["Astro 6", "Tailwind CSS v4", "TypeScript", "Cloudflare Workers", "MDX"]`

**Audit findings (everything else):** None of the speculative audit targets exist in this file:
- No `"canvas"`, `"WebGL"`, `"canvas hero"`, or `"generative hero"` anywhere
- No `"dark mode"`, `"dark theme"`, `"theme toggle"`, or `"light/dark"` references
- No `"project card grid"`, `"card grid"`, `"featured cards"` references
- No `"scroll animation"`, `"scroll trigger"`, `"GSAP scroll"`, or `"reveal animation"` references
- No `"IBM Plex Mono"` or typography-as-design-language references
- No `"oklch"`, `"hex"` palette descriptions
- No `"shiyunlu"` references
- No `"Inter"` references (the only `inter` substring is "interactive" in the NFL Prediction System description on line 29 — that's normal English, not a typography ref)

The file is content-focused (personal info, education, skills, project descriptions, contact, siteStack) and never described the v1.0 visual design language to begin with. So this audit reduced to a single rename: drop GSAP. JSON parses cleanly post-edit.

## Acceptance Criteria Verification

### Task 1
- `grep -c 'token-' src/components/chat/ChatWidget.astro` = **0** ✓
- `grep -c 'token-' src/styles/global.css` = **0** ✓ (after stale comment fix)
- `grep -c 'var(--accent)' src/components/chat/ChatWidget.astro` = **2** ✓ (≥2 — bubble + send button)
- `grep -c 'var(--bg)' src/components/chat/ChatWidget.astro` = **2** ✓ (≥2 — panel + input area)
- `grep -c 'var(--rule)' src/components/chat/ChatWidget.astro` = **9** ✓ (≥5)
- `grep -c 'var(--ink)' src/components/chat/ChatWidget.astro` = **2** ✓ (≥2)
- `grep -c 'var(--ink-muted)' src/components/chat/ChatWidget.astro` = **4** ✓ (≥4)
- `grep -c 'var(--ink-faint)' src/components/chat/ChatWidget.astro` = **3** ✓ (≥3)
- `grep -c 'var(--font-mono)' src/styles/global.css` = **1** ✓ (≥1)
- `grep -c 'var(--font-code)' src/styles/global.css` = **0** ✓
- `grep -c 'var(--accent)' src/styles/global.css` = **5** ✓ (≥4)
- `grep -c '\.chat-' src/styles/global.css` = **15** ✓ (≥5 — chat rules intact)
- `grep -c 'nav-link-hover' src/styles/global.css` = **4** ✓ (≥1, D-13 survivor preserved)
- `grep -c '\.chat-copy-btn' src/styles/global.css` = **2** ✓ (≥1, D-13 survivor preserved)
- `grep -c 'oklch(' src/styles/global.css` = **0** ✓

### Task 2
- `node -e "JSON.parse(...)"` exits 0 ✓ (printed `valid`)
- `grep -c '"GSAP"' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'gsap' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'canvas hero\|generative hero' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'dark mode\|dark theme\|theme toggle' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'IBM Plex Mono' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'oklch' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'shiyunlu' src/data/portfolio-context.json` = **0** ✓
- `grep -ci 'scroll trigger\|scroll animation' src/data/portfolio-context.json` = **0** ✓

## Deviations from Plan

### Housekeeping: stale @theme doc comment in global.css

**Found during:** Task 1 verification grep
**Issue:** Acceptance criterion `grep -c 'token-' src/styles/global.css` must return 0, but a documentation comment in the LAYER 2 `@theme` bridge section (line 26) still said `"All color values use var(--token-*) references..."`. This was a literal substring `--token-*` in a comment block — not a live CSS reference, but it broke the grep.
**Fix:** Rewrote the comment to `"All color values reference the editorial :root tokens so palette changes propagate automatically"`. Same meaning, no `token-` substring. Bundled into the Task 1 commit.
**Files modified:** src/styles/global.css
**Commit:** 4895561

No other deviations. The portfolio-context.json audit found no v1.0 references beyond the GSAP entry the plan explicitly called out.

## Confirmation Greps (post-commit)

```
$ grep -c 'token-' src/components/chat/ChatWidget.astro src/styles/global.css src/data/portfolio-context.json
src/components/chat/ChatWidget.astro:0
src/styles/global.css:0
src/data/portfolio-context.json:0

$ node -e "JSON.parse(require('fs').readFileSync('src/data/portfolio-context.json', 'utf8')); console.log('valid')"
valid
```

After Plans 03 + 05, the chat widget's token cascade is structurally complete. The widget is visually unchanged per D-19 — Phase 10's CHAT-02 will own the full editorial restyle.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | `4895561` | feat(08-05): rename chat widget token references to editorial vocabulary |
| 2 | `6efb9b1` | feat(08-05): remove GSAP from siteStack in chat system-prompt context |

## Self-Check: PASSED

- FOUND: src/components/chat/ChatWidget.astro (modified in 4895561)
- FOUND: src/styles/global.css (modified in 4895561)
- FOUND: src/data/portfolio-context.json (modified in 6efb9b1)
- FOUND commit: 4895561
- FOUND commit: 6efb9b1
- `grep -c 'token-'` returns 0 for all three files: FOUND
- JSON parse passes: FOUND
- DSGN-02 (chat surface side of token cascade) structurally complete: FOUND
- DSGN-04 (no motion added) preserved: FOUND
