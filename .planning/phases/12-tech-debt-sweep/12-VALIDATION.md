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

### Manual (requires human + browser + preview/prod deploy) — APPROVED 2026-04-15

> Claude cannot run the manual smoke tests below (they need interactive keyboard focus cycling against live DOM, SSE network round-trips to the preview deploy, clipboard writes, and Lighthouse CI runs against production). Claude has shipped the code change and run every automated gate. **Human verified 2026-04-15: Jack approved Parts A–D via checkpoint resume signal `approved`.** Per-bullet verdicts rolled up into the single blanket approval below; no regressions reported.

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

- [x] 30x Tab: `document.activeElement` never leaves `.mobile-menu` — APPROVED (Jack, 2026-04-15)
- [x] 30x Shift+Tab: same — APPROVED (Jack, 2026-04-15)
- [x] Escape closes, focus returns to trigger — APPROVED (Jack, 2026-04-15)
- [x] inert `""` after open — APPROVED (Jack, 2026-04-15)
- [x] inert `null` after close — APPROVED (Jack, 2026-04-15)

**Part B — D-26 manual smoke (preview deploy or production):**

- [x] Open chat panel — focus lands in input; Tab cycles stay inside panel — APPROVED (Jack, 2026-04-15)
- [x] Send message — SSE stream renders live tokens; typing indicator visible — APPROVED (Jack, 2026-04-15)
- [x] 30s AbortController timeout — kill network mid-stream; recovery + error rendered — APPROVED (Jack, 2026-04-15)
- [x] Rate limit 5/60s — 6th message rejected with user-facing error — APPROVED (Jack, 2026-04-15)
- [x] localStorage persistence — close/reopen; history replays with correct role styling — APPROVED (Jack, 2026-04-15)
- [x] localStorage cap — 50 messages max; 24h TTL — APPROVED (Jack, 2026-04-15)
- [x] Markdown rendering — DOMPurify strict whitelist — APPROVED (Jack, 2026-04-15)
- [x] Copy button live stream — COPY → COPIED (accent) → COPY (1s) — APPROVED (Jack, 2026-04-15)
- [x] Copy button replayed (after reload) — identical markup/behavior — APPROVED (Jack, 2026-04-15)
- [x] Clipboard idempotency — double-click within 1s — only one transition — APPROVED (Jack, 2026-04-15)
- [x] Focus trap re-query in chat panel — Tab 20+ times, activeElement stays in panel — APPROVED (Jack, 2026-04-15)

**Part C — Phase 12 specific:**

- [x] Open mobile menu while chat panel CLOSED — chat bubble inert (Tab skips) — APPROVED (Jack, 2026-04-15)
- [x] Open mobile menu while chat panel OPEN — entire `.chat-widget` root inert per Claude's-discretion decision (panel still visually visible, not tabbable) — APPROVED (Jack, 2026-04-15)
- [x] Close mobile menu — chat bubble + panel regain tab order and interactivity — APPROVED (Jack, 2026-04-15)

**Part D — Lighthouse gate:**

- [x] Homepage: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100 — APPROVED (Jack, 2026-04-15)
- [x] One project detail (e.g. `/projects/seatwatch`): same thresholds — APPROVED (Jack, 2026-04-15)

**D-26 Gate Verdict for Plan 12-02:** ALL GREEN — automated (7/7) + manual (21/21) all confirmed.

---

## D-26 Chat Regression Gate — Plan 12-03

**Run:** 2026-04-15T16:17:00Z (local)
**Commit SHA:** `23cd3f0` (Plan 12-03 Task 2 — `createCopyButton` helper + both call-site swaps)
**Surface touched:** `src/scripts/chat.ts` — direct edit (copy-button helper extraction, live-stream SVG block deleted, replay inline block deleted, clipboard idempotency rewire at :815-827 preserved byte-identical).

### Automated (run locally from clean tree post-commit `23cd3f0`)

| Gate item | Command | Result | Evidence |
|-----------|---------|--------|----------|
| XSS sanitization — `tests/client/markdown.test.ts` (12 tests) | `npx vitest run tests/client/markdown` | PASS | File fully green in full-suite run |
| CORS exact-origin whitelist — `tests/api/chat.test.ts` + `tests/api/security.test.ts` | `npx vitest run` | PASS | Both files fully green |
| SSE stream contract — `tests/api/chat.test.ts` streaming mock + error-event tests | `npx vitest run` | PASS | File fully green |
| Body size guard — `tests/api/chat.test.ts` body-size test | `npx vitest run` | PASS | File fully green |
| Prompt injection defense — `tests/api/security.test.ts` (12 tests) | `npx vitest run` | PASS | File fully green |
| `createCopyButton` helper — `tests/client/chat-copy-button.test.ts` (5 tests) | `npx vitest run tests/client/chat-copy-button` | PASS | 5/5 green: canonical markup, live/replay parity (outerHTML byte-equal), COPY→COPIED→COPY transition with accent color flip, click-time getContent invocation, cloneNode idempotency compat |
| Zero-warning build | `pnpm build` | PASS | `- 0 errors / - 0 warnings`; final line `pages-compat: restructured dist/client/ for Cloudflare Pages` |
| Lint | `pnpm lint` | PASS | Empty stdout (clean) |
| Astro check | `pnpm exec astro check` | PASS | `Result (46 files): 0 errors, 0 warnings, 0 hints` |

**Full-suite result:** 97 passed / 1 failed (98 total). The 1 failure is `tests/client/contact-data.test.ts > email is jack@jackcutrara.com` — pre-existing unrelated failure already tracked in `.planning/phases/12-tech-debt-sweep/deferred-items.md` for Plan 12-06 closeout. Plan 12-03 does not touch contact data.

**Idempotency block preservation check:**

```bash
git show HEAD~1:src/scripts/chat.ts | sed -n '820,832p'  # pre-Task-2
git show HEAD:src/scripts/chat.ts   | sed -n '817,827p'  # post-Task-2
```

Pre/post diff: **byte-identical** — `copyBtn.replaceWith(copyBtn.cloneNode(true))` rewire block at chat.ts:817-827 is preserved verbatim per RESEARCH.md A2 / D-08 invariant.

**Acceptance-criteria greps (post-Task-2 HEAD):**

| Grep | Expected | Actual |
|------|----------|--------|
| `^export function createCopyButton` | 1 | 1 ✓ |
| `createCopyButton(() => content)` | 1 | 1 ✓ (live-stream path, `createBotMessageEl`) |
| `createCopyButton(() => msg.content)` | 1 | 1 ✓ (replay path, `openPanel` history replay) |
| `copyBtn.innerHTML` | 0 | 0 ✓ (SVG block removed — XSS surface eliminated per T-12-03-01) |
| `<svg` in chat.ts | 0 | 0 ✓ |
| `copyBtn.replaceWith(copyBtn.cloneNode(true))` | 1 | 1 ✓ (idempotency guard preserved) |

### Manual (requires human + browser + preview/prod deploy) — PENDING

The following items require a human with a running `pnpm preview` (or staging deploy) to verify per 12-RESEARCH.md §D-26 Chat Regression Gate Checklist lines 337-367:

**Part A — Chat widget functional smoke on preview (`pnpm build && pnpm preview`):**

- [ ] Open chat panel — focus lands in input; Tab cycles stay inside panel (focus trap re-query on every Tab)
- [ ] Send "Hello" — SSE stream renders tokens live; typing indicator visible during stream
- [ ] **COPY BUTTON — LIVE STREAM:** on the streamed bot reply, click COPY. Expect:
  - [ ] Text flips from `COPY` to `COPIED`
  - [ ] Color flips from `var(--ink-faint)` to `var(--accent)` (DevTools computed style)
  - [ ] After 1 second, reverts to `COPY` in `var(--ink-faint)`
  - [ ] Clipboard contains the bot message content (paste into scratch doc)
- [ ] Reload page (localStorage replay triggers)
- [ ] **COPY BUTTON — REPLAY:** on the same rehydrated bot reply, click COPY. Expect IDENTICAL markup + IDENTICAL behavior to the live-stream bullet. Inspect element on both buttons — `outerHTML` should be byte-equal except for the post-click transient text state.
- [ ] **IDEMPOTENCY:** on a bot message, double-click COPY within the 1s window. Expect only ONE transition (no double-flip, no double-clipboard-write). Confirms JS boolean + DOM data-attribute guards from Phase 7 still operate.
- [ ] 30s AbortController timeout — kill network mid-stream; client recovers, error message rendered, panel still usable
- [ ] Rate limit 5/60s — send 6 messages rapidly; 6th rejected with user-facing error
- [ ] localStorage persistence + cap — send 51 messages; verify 50-msg cap via DevTools Application → Local Storage
- [ ] 24h TTL — set `Date.now()` mock in DevTools console; reopen chat; expired messages purged
- [ ] Markdown rendering — bot reply with `**bold**`, `*italic*`, `- list`, `` `code` ``, `[link](https://…)` — all render via DOMPurify strict whitelist (no `<script>`, no inline handlers)
- [ ] Focus trap re-query — open chat, Tab 20+ times; `document.activeElement` never leaves chat panel subtree

**Part B — Phase-12-specific D-26 additions:** N/A for Plan 12-03 (no inert change — that was Plan 12-02, already approved).

**Part C — Lighthouse CI:**

- [ ] Homepage: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100
- [ ] One project detail (e.g. `/projects/seatwatch`): same thresholds

**Part D — Inspection evidence:**

- [ ] Screenshot or `outerHTML` DevTools excerpt of the live-stream copy button
- [ ] Same for a replayed copy button (post-reload)
- [ ] Diff confirms byte-equal markup except for post-click transient state

**D-26 Gate Verdict for Plan 12-03:** AUTOMATED ALL GREEN (9/9). MANUAL smoke + Lighthouse **deferred to consolidated phase-end D-26 gate** (covers 12-02 + 12-03 chat-adjacent changes together — see `## D-26 Phase-End Consolidated Gate` below).

---

## D-26 Phase-End Consolidated Gate

Per-plan manual D-26 verification was collapsed into a single phase-end gate on 2026-04-15 to avoid redundant browser smoke per plan. This gate covers both chat-adjacent plans (12-02 inert extension + 12-03 copy-button dedup) in one pass.

**Run after:** all 6 plans complete (12-06 commits).

**Coverage (union of 12-02 Part A/B/C/D + 12-03 Part A/C/D):**

- [ ] Keyboard-cycle test (mobile menu open → Tab/Shift+Tab 30× on `/projects`; focus never escapes menu; inert on header/main/footer/.chat-widget confirmed in DevTools)
- [ ] Mobile menu × chat interaction matrix (menu open with chat closed; menu open with chat open; inert restoration on menu close)
- [ ] Chat panel functional smoke (open, Tab cycle, send, SSE stream renders tokens, typing indicator)
- [ ] COPY button live-stream: text flip COPY→COPIED, color flip faint→accent, 1s revert, clipboard contents correct
- [ ] COPY button replay (after reload): byte-identical markup to live-stream, same behavior, idempotent on double-click
- [ ] 30s AbortController timeout recovery
- [ ] Rate limit 5/60s — 6th message rejected with user-facing error
- [ ] localStorage 50-msg cap + 24h TTL
- [ ] Markdown rendering via DOMPurify strict whitelist
- [ ] Focus trap re-query never escapes chat panel
- [ ] DevTools `outerHTML` diff: live-stream vs replay copy buttons byte-equal (except post-click transient)
- [ ] Lighthouse CI on `/` + one project detail: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## DEBT-03 OG URL Production Verification

**Run date:** 2026-04-15
**Commit SHA at time of run:** `aead835`
**User-Agent:** `facebookexternalhit/1.1`
**Command:** `curl -sL -A "facebookexternalhit/1.1" "<URL>" | grep -oE '<meta property="og:(url|image)" content="[^"]*"'` — raw output at `/tmp/12-04-og-sweep.log`
**Chosen project slug:** `seatwatch`

| URL | og:url captured | og:image captured | Verdict |
|-----|-----------------|-------------------|---------|
| `https://jackcutrara.com/` | `https://jackcutrara.com/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/about` | `https://jackcutrara.com/about/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/projects` | `https://jackcutrara.com/projects/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/projects/seatwatch` | `https://jackcutrara.com/projects/seatwatch/` | `https://jackcutrara.com/og-default.png` | PASS |
| `https://jackcutrara.com/contact` | `https://jackcutrara.com/contact/` | `https://jackcutrara.com/og-default.png` | PASS |

**Per-URL observations:**

- All 5 `og:url` values are absolute with correct `https://jackcutrara.com` origin.
- All 5 `og:image` values are absolute, correctly resolved via the `resolveOg` guard at `src/layouts/BaseLayout.astro:38-39` (root-relative `/og-default.png` → `https://jackcutrara.com/og-default.png` with no double-prefix corruption).
- Non-homepage `og:url` values carry a trailing slash (Astro/Cloudflare Pages canonical form) — no double-slash, no `localhost`, no preview-deploy hostname, no `https://jackcutrara.comhttps://...` corruption. Matches the site's canonical URL shape.
- No query strings, fragments, or stale hostnames leaked in any of the 5 responses.

**All-pass verdict:** DEBT-03 closed — `resolveOg` guard at `src/layouts/BaseLayout.astro:38-39` verified shipping correct absolute URLs across all 5 page types on production. No code change required.

