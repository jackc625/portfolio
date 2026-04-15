---
phase: 12
slug: tech-debt-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1 + jsdom (already installed) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --run --reporter=dot` |
| **Full suite command** | `pnpm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run --reporter=dot`
- **After every plan wave:** Run `pnpm test -- --run` + `pnpm build`
- **Before `/gsd-verify-work`:** Full suite + build + lint all green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *Populated by planner* | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/client/chat-copy-button.test.ts` — snapshot + behavior test for `createCopyButton()` helper (DEBT-04)
- [ ] Existing `vitest.config.ts` + jsdom environment covers new test — no framework install needed

*OG curl verification script is embedded in this doc below (manual-only for DEBT-03).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile menu keyboard-cycle inert check | DEBT-02 | Requires interactive Tab presses against live DOM; focus-cycle assertions against `document.activeElement` are simpler with human driver than synthetic events | Open menu on `/projects`, press Tab 30+ times with `document.activeElement` logged in DevTools; assert focus never leaves `.mobile-menu` subtree. Repeat with Shift+Tab. |
| OG URL production verification | DEBT-03 | Requires deployed production origin (dev preview URLs would resolve to localhost) | Run `curl -A "facebookexternalhit/1.1" https://jackcutrara.com/<path> \| grep -E "og:url\|og:image"` against 5 URLs: `/`, `/about`, `/projects`, `/projects/<slug>`, `/contact`. Record URL captured + verdict in 5-row table. |
| Zero-warning build check | DEBT-01 | Warnings surface only in live wrangler/astro/eslint output streams | `pnpm build` then `pnpm lint` — both exit 0 with zero warning lines in stdout/stderr |
| D-26 Chat Regression Gate | DEBT-02, DEBT-04 | Full battery covers XSS, CORS, rate limit, SSE, focus trap, localStorage, clipboard, abort — mix of automated + manual smoke | Follow `12-RESEARCH.md §D-26 Chat Regression Gate Checklist` end-to-end |

---

## D-26 Chat Regression Gate — Plan 12-02

**Run:** 2026-04-15T19:12:13Z
**Commit SHA:** `b46a9a6` (Plan 12-02 Task 1 — MobileMenu `.chat-widget` inert extension)
**Surface touched:** `src/components/primitives/MobileMenu.astro` — indirect BaseLayout-adjacent surface (toggles attributes on `.chat-widget` DOM node mounted by `ChatWidget.astro` inside `BaseLayout.astro`). No edits to `chat.ts`, `api/chat.ts`, `global.css`, or `BaseLayout.astro` itself.

### Automated (run locally from clean tree post-commit `b46a9a6`)

| Gate item | Command | Result | Evidence |
|-----------|---------|--------|----------|
| XSS sanitization — `tests/client/markdown.test.ts` | `pnpm test -- --run` | PASS | File fully green in 92/93 passing test count |
| CORS exact-origin whitelist — `tests/api/chat.test.ts` + `tests/api/security.test.ts` | `pnpm test -- --run` | PASS | Both files fully green |
| SSE stream contract — `tests/api/chat.test.ts` streaming mock + error-event tests | `pnpm test -- --run` | PASS | File fully green |
| Body size guard — `tests/api/chat.test.ts` body-size test | `pnpm test -- --run` | PASS | File fully green |
| Prompt injection defense — `tests/api/security.test.ts` | `pnpm test -- --run` | PASS | File fully green |
| `pnpm build` zero warnings | `pnpm build` | PASS | Wrangler 4.83.0, astro check 0/0/0, build Complete!, no `warn`/`unexpected` lines |
| `pnpm lint` zero warnings | `pnpm lint` | PASS | Empty output (eslint exit 0) |

**Aggregate automated test status:** 92/93 pass. The single failure is `tests/client/contact-data.test.ts > email is jack@jackcutrara.com` — **pre-existing, unrelated to Plan 12-02** (cause: commit `de85698 chore: updated contact info` changed `CONTACT.email` without updating the assertion). Recorded in `.planning/phases/12-tech-debt-sweep/deferred-items.md`. Zero D-26 gate items are affected.

### Manual (requires human + browser + preview/prod deploy) — PENDING

> Claude cannot run the manual smoke tests below (they need interactive keyboard focus cycling against live DOM, SSE network round-trips to the preview deploy, clipboard writes, and Lighthouse CI runs against production). Claude has shipped the code change and run every automated gate. **Human action required** to complete these bullets; record the per-bullet verdict here once run.

**Part A — Keyboard-cycle test (DEBT-02 per D-11):**

1. Start preview: `pnpm dev` (or `pnpm preview` after `pnpm build`)
2. Open Chrome/Safari on mobile viewport (or narrow desktop <380px so MobileMenu is visible per D-06 container query)
3. Navigate to `/projects` (rich background — 6 WorkRows + footer social links + chat bubble)
4. DevTools Console: `setInterval(() => console.log(document.activeElement?.className || document.activeElement?.tagName), 200);`
5. Click the mobile menu trigger
6. Press Tab 30 times — activeElement must stay inside `.mobile-menu` subtree
7. Press Shift+Tab 30 times — same assertion
8. Press Escape — menu closes, focus returns to trigger, no console errors
9. Open menu again. `document.querySelector(".chat-widget").getAttribute("inert")` → expected `""`
10. Close menu. Same query → expected `null`

- [ ] 30x Tab: `document.activeElement` never leaves `.mobile-menu` — PENDING
- [ ] 30x Shift+Tab: same — PENDING
- [ ] Escape closes, focus returns to trigger — PENDING
- [ ] inert `""` after open — PENDING
- [ ] inert `null` after close — PENDING

**Part B — D-26 manual smoke (preview deploy or production):**

- [ ] Open chat panel — focus lands in input; Tab cycles stay inside panel — PENDING
- [ ] Send message — SSE stream renders live tokens; typing indicator visible — PENDING
- [ ] 30s AbortController timeout — kill network mid-stream; recovery + error rendered — PENDING
- [ ] Rate limit 5/60s — 6th message rejected with user-facing error — PENDING
- [ ] localStorage persistence — close/reopen; history replays with correct role styling — PENDING
- [ ] localStorage cap — 50 messages max; 24h TTL — PENDING
- [ ] Markdown rendering — DOMPurify strict whitelist — PENDING
- [ ] Copy button live stream — COPY → COPIED (accent) → COPY (1s) — PENDING
- [ ] Copy button replayed (after reload) — identical markup/behavior — PENDING
- [ ] Clipboard idempotency — double-click within 1s — only one transition — PENDING
- [ ] Focus trap re-query in chat panel — Tab 20+ times, activeElement stays in panel — PENDING

**Part C — Phase 12 specific:**

- [ ] Open mobile menu while chat panel CLOSED — chat bubble inert (Tab skips) — PENDING
- [ ] Open mobile menu while chat panel OPEN — entire `.chat-widget` root inert per Claude's-discretion decision (panel still visually visible, not tabbable) — PENDING
- [ ] Close mobile menu — chat bubble + panel regain tab order and interactivity — PENDING

**Part D — Lighthouse gate:**

- [ ] Homepage: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100 — PENDING
- [ ] One project detail (e.g. `/projects/seatwatch`): same thresholds — PENDING

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
