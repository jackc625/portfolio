---
phase: 7
slug: chatbot-feature
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `rtk vitest run` |
| **Full suite command** | `rtk vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `rtk vitest run`
- **After every plan wave:** Run `rtk vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | D-09 | — | Server endpoint returns streaming response | unit | `rtk vitest run tests/api/chat.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | D-22 | T-07-01 | Input validation rejects invalid messages | unit | `rtk vitest run tests/api/validation.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | D-23 | T-07-01 | Messages over 500 chars rejected | unit | `rtk vitest run tests/api/validation.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | D-25 | T-07-02 | Markdown rendering sanitizes XSS | unit | `rtk vitest run tests/client/markdown.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | S1 | T-07-03 | Prompt injection patterns handled | unit | `rtk vitest run tests/api/security.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-06 | 01 | 1 | S7 | T-07-04 | Conversation history validated | unit | `rtk vitest run tests/api/validation.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — vitest config for the project
- [ ] `tests/api/chat.test.ts` — server endpoint behavior tests
- [ ] `tests/api/validation.test.ts` — input validation + history sanitization
- [ ] `tests/api/security.test.ts` — prompt injection pattern detection
- [ ] `tests/client/markdown.test.ts` — markdown rendering + XSS sanitization
- [ ] Test environment setup for Cloudflare Workers APIs (miniflare or mocks)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chat widget opens/closes with animation | D-06 | GSAP visual animation | Open site, click chat bubble, verify scale+fade animation |
| Mobile full-screen takeover | D-05 | Viewport-dependent layout | Open on mobile, verify chat fills screen |
| Typing indicator animation | D-28 | Visual animation timing | Send message, verify three-dot animation appears |
| Theme-aware styling | D-04 | Visual appearance | Toggle dark/light mode, verify chat matches theme |
| Chat persists across navigation | D-07 | View transition behavior | Start chat, navigate to another page, verify chat state preserved |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
