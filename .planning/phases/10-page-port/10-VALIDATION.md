---
phase: 10
slug: page-port
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm run build` |
| **Full suite command** | `pnpm run build && pnpm run lint && pnpm run check && pnpm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run build`
- **After every plan wave:** Run `pnpm run build && pnpm run lint && pnpm run check && pnpm run test`
- **Before `/gsd-verify-work`:** Full suite green + manual chat smoke + manual persistence test + manual visual parity check
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *Populated after planning* | | | | | | | | | |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

- `vitest.config.ts` -- exists
- `tests/client/markdown.test.ts` -- covers markdown sanitization (CHAT-01)
- `pnpm run build` -- catches schema errors, import errors, type errors (WORK-03, all pages)

*Existing infrastructure covers all automatable aspects.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Homepage hero renders correctly | HOME-01 | Astro page rendering not unit-testable without E2E | Visual check at desktop/tablet/mobile widths against mockup.html |
| Work list renders featured projects | HOME-02 | Visual layout verification | Check 3 featured projects render as numbered rows on homepage |
| About preview section renders | HOME-03 | Visual layout verification | Check § 02 section on homepage |
| Contact section renders | HOME-04 | Visual layout verification | Check § 03 section on homepage |
| About page editorial structure | ABOUT-01 | Visual layout verification | Verify intro + 3 paragraphs, no icons/progress bars |
| About copy word count | ABOUT-02 | Content verification | Count words per paragraph (<=80 each) |
| Projects index numbered list | WORK-01 | Visual layout verification | All 6 projects as numbered rows, no card grid |
| Case study editorial layout | WORK-02 | Visual layout verification | Mono metadata, large title, body column on each detail page |
| Minimal contact layout | CONTACT-01 | Visual layout verification | GET IN TOUCH label + mono links, no icons/form |
| Resume download link | CONTACT-02 | Browser behavior verification | Click resume link, verify download attribute and PDF |
| Chat functionality + persistence | CHAT-01 | Interactive behavior | Open chat, send message, navigate away, reopen, verify history persisted |
| Chat visual restyle | CHAT-02 | Visual verification | Flat rectangle panel, no shadows/gradients, accent bubble only round surface |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
